use itertools::Itertools;
use near_sdk::json_types::U128;
use near_sdk::store::{IterableMap, LookupMap};
use near_sdk::{
    env, ext_contract, near, near_bindgen, serde_json, AccountId, NearToken, PanicOnDefault,
    Promise, PromiseError, PromiseOrValue,
};
use std::cmp;
use std::collections::HashMap;
use strum::IntoEnumIterator;

mod figures;
mod storage;

use figures::*;
use storage::*;

const MIN_STAKE: u128 = 10u128.pow(24);
const MAX_TURNS: usize = 10;

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct FigureData {
    pub name: HistoricalFigure,
    pub wit: u8,
    pub brutality: u8,
    pub strategy: u8,
    pub mockery: u8,
}

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct LeaderboardItem {
    pub account_id: AccountId,
    pub value: u32,
}

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct RoastIndex {
    pub duel_id: U128,
    pub turn: usize,
    pub current_figure: HistoricalFigure,
    pub next_figure: HistoricalFigure,
    pub damage: u8,
    pub style: RoastStyle,
}

#[ext_contract(ext_ft_contract)]
trait FtContract {
    fn ft_transfer(&mut self, receiver_id: AccountId, amount: U128, memo: Option<String>);
    fn ft_balance_of(&self, account_id: AccountId) -> U128;
    fn ft_burn(&mut self, amount: U128);
}

#[near(serializers = [json, borsh])]
#[serde(tag = "function", rename_all = "snake_case")]
pub enum Msg {
    CreateDuel {
        figure: HistoricalFigure,
    },
    AcceptDuel {
        duel_id: U128,
        figure: HistoricalFigure,
    },
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct DuelManagerContract {
    admin_id: AccountId,
    ft_contract: AccountId,
    duels: IterableMap<u128, Duel>,
    next_duel_id: u128,
    stakes: LookupMap<AccountId, u128>,
    total_stake: u128,
}

#[near_bindgen]
impl DuelManagerContract {
    #[init]
    pub fn new(admin_id: AccountId, ft_contract: AccountId) -> Self {
        Self {
            admin_id,
            ft_contract,
            duels: IterableMap::new(b"d"),
            next_duel_id: 0,
            stakes: LookupMap::new(b"s"),
            total_stake: 0,
        }
    }

    pub fn get_figures() -> Vec<FigureData> {
        HistoricalFigure::iter()
            .map(|figure| {
                let stats = figure.stats();
                FigureData {
                    name: figure,
                    wit: stats.wit,
                    brutality: stats.brutality,
                    strategy: stats.strategy,
                    mockery: stats.mockery,
                }
            })
            .collect()
    }

    pub fn get_duel(&self, duel_id: U128) -> Option<Duel> {
        self.duels.get(&duel_id.0).cloned()
    }

    pub fn get_finished_duels(&self, count: usize, offset: usize) -> Vec<Duel> {
        self.duels
            .values()
            .filter(|d| d.winner.is_some())
            .sorted_by(|a, b| a.creation_time.cmp(&b.creation_time).reverse())
            .skip(offset)
            .take(count)
            .cloned()
            .collect()
    }

    pub fn get_active_duels(&self, count: usize, offset: usize) -> Vec<Duel> {
        self.duels
            .values()
            .filter(|d| d.player_b.is_some() && d.winner.is_none())
            .sorted_by(|a, b| a.creation_time.cmp(&b.creation_time).reverse())
            .skip(offset)
            .take(count)
            .cloned()
            .collect()
    }

    pub fn get_pending_duels(&self, count: usize, offset: usize) -> Vec<Duel> {
        self.duels
            .values()
            .filter(|d| d.player_b.is_none() && d.winner.is_none())
            .sorted_by(|a, b| a.creation_time.cmp(&b.creation_time).reverse())
            .skip(offset)
            .take(count)
            .cloned()
            .collect()
    }

    pub fn get_account_duels(&self, account_id: AccountId) -> Vec<Duel> {
        self.duels
            .values()
            .filter(|d| d.player_a == account_id || d.player_b.as_ref() == Some(&account_id))
            .sorted_by(|a, b| a.creation_time.cmp(&b.creation_time).reverse())
            .cloned()
            .collect()
    }

    pub fn get_leaderboard_by_wins(&self, count: usize, offset: usize) -> Vec<LeaderboardItem> {
        let mut win_board: HashMap<AccountId, u32> = HashMap::new();

        for duel in self.duels.values() {
            match duel.winner {
                Some(Winner::PlayerA) => *win_board.entry(duel.player_a.clone()).or_insert(0) += 1,
                Some(Winner::PlayerB) => {
                    *win_board.entry(duel.player_b.clone().unwrap()).or_insert(0) += 1
                }
                _ => (),
            }
        }

        win_board
            .into_iter()
            .sorted_by(|a, b| a.1.cmp(&b.1).reverse())
            .skip(offset)
            .take(count)
            .map(|(account_id, value)| LeaderboardItem { account_id, value })
            .collect()
    }

    pub fn get_leaderboard_by_damage(&self, count: usize, offset: usize) -> Vec<LeaderboardItem> {
        let mut damage_board: HashMap<AccountId, u32> = HashMap::new();

        for duel in self.duels.values() {
            if duel.winner.is_none() {
                continue;
            }

            for (i, turn) in duel.turns.iter().enumerate() {
                let attacker = if i % 2 == 0 {
                    duel.player_a.clone()
                } else {
                    duel.player_b.clone().unwrap()
                };

                *damage_board.entry(attacker).or_insert(0) += turn.damage as u32;
            }
        }

        damage_board
            .into_iter()
            .sorted_by(|a, b| a.1.cmp(&b.1).reverse())
            .skip(offset)
            .take(count)
            .map(|(account_id, value)| LeaderboardItem { account_id, value })
            .collect()
    }

    pub fn get_top_duel(&self) -> Option<Duel> {
        let now = env::block_timestamp();
        let one_day = 24 * 60 * 60 * 1_000_000_000;

        self.duels
            .values()
            .filter(|d| {
                let has_winning_player = match d.winner {
                    Some(Winner::PlayerA) | Some(Winner::PlayerB) => true,
                    _ => false,
                };
                has_winning_player
                    && d.turns.len() == 10
                    && now.saturating_sub(d.turns.last().unwrap().creation_time) <= one_day
            })
            .max_by(|a, b| a.stake.0.cmp(&b.stake.0))
            .cloned()
    }

    pub fn get_roast_queue(&self) -> Vec<RoastIndex> {
        self.duels
            .values()
            .map(|duel| {
                duel.turns
                    .iter()
                    .enumerate()
                    .filter(|(_, turn)| turn.roast_cid.is_none())
                    .map(|(i, turn)| RoastIndex {
                        duel_id: duel.id,
                        turn: i,
                        current_figure: if i % 2 == 0 {
                            duel.figure_a.clone()
                        } else {
                            duel.figure_b.unwrap()
                        },
                        next_figure: if i % 2 == 0 {
                            duel.figure_b.unwrap()
                        } else {
                            duel.figure_a.clone()
                        },
                        damage: turn.damage,
                        style: turn.style,
                    })
            })
            .flatten()
            .collect()
    }

    pub fn get_balance(&self, account_id: AccountId) -> U128 {
        U128(self.stakes.get(&account_id).copied().unwrap_or(0))
    }

    #[payable]
    pub fn create_duel(&mut self, figure: HistoricalFigure, stake: U128) -> U128 {
        assert!(
            env::attached_deposit() == NearToken::from_yoctonear(1),
            "This function requires exactly 1 yoctoNEAR to be attached for security purposes."
        );

        let sender = env::predecessor_account_id();
        self._create_duel(sender, figure, stake)
    }

    #[payable]
    pub fn accept_duel(&mut self, duel_id: U128, figure: HistoricalFigure) {
        assert!(
            env::attached_deposit() == NearToken::from_yoctonear(1),
            "This function requires exactly 1 yoctoNEAR to be attached for security purposes."
        );

        let sender = env::predecessor_account_id();
        self._accept_duel(sender, duel_id, figure);
    }

    #[payable]
    pub fn take_turn(&mut self, duel_id: U128, style: RoastStyle) -> PromiseOrValue<u8> {
        assert!(
            env::attached_deposit() == NearToken::from_yoctonear(1),
            "This function requires exactly 1 yoctoNEAR to be attached for security purposes."
        );

        let sender = env::predecessor_account_id();
        let mut duel = self.duels.get(&duel_id.0).expect("Duel not found.").clone();

        assert!(
            duel.player_b.is_some(),
            "Duel must be accepted before taking turns."
        );
        assert!(
            duel.turns.len() < MAX_TURNS && duel.winner.is_none(),
            "Duel already completed."
        );

        // Determine whose turn it is
        let is_player_a = duel.turns.len() % 2 == 0;
        let current_player = if is_player_a {
            &duel.player_a
        } else {
            duel.player_b.as_ref().unwrap()
        };

        assert!(current_player == &sender, "Invalid sender.");

        let last_roast_style = duel.turns.iter().last().map(|turn| turn.style);

        // Roll damage based on the chosen roast style
        let figure = if is_player_a {
            duel.figure_a.clone()
        } else {
            duel.figure_b.clone().unwrap()
        };
        let stats = figure.stats();
        let stat_damage = match style {
            RoastStyle::Witty => stats.wit,
            RoastStyle::Brutal => stats.brutality,
            RoastStyle::Strategic => stats.strategy,
            RoastStyle::Mocking => stats.mockery,
        };
        let max_damage = match last_roast_style {
            Some(last_style) if style.is_strong_against(last_style) => stat_damage + 5,
            _ => stat_damage,
        };

        let damage = (env::random_seed()[0] as u8 % max_damage) + 1; // Roll between 1 and max damage
        let damage = match last_roast_style {
            Some(last_style) if style.is_weak_against(last_style) => {
                cmp::max(damage.checked_sub(5).unwrap_or(0), 1)
            }
            _ => damage,
        };
        duel.turns.push(Turn {
            creation_time: env::block_timestamp(),
            damage,
            style,
            roast_cid: None,
        });

        // If max turns reached, determine winner
        if duel.turns.len() == MAX_TURNS {
            let damage_a: u8 = duel.turns.iter().step_by(2).map(|t| t.damage).sum();
            let damage_b: u8 = duel.turns.iter().skip(1).step_by(2).map(|t| t.damage).sum();
            if damage_a > damage_b {
                let player_a = duel.player_a.clone();
                let reward = duel.stake.0 * 2;
                let fee = reward / 10;
                duel.winner = Some(Winner::PlayerA);
                env::log_str(&format!(
                    "Duel {} finished! Result: {} won!",
                    duel.id.0, player_a
                ));

                self.burn(U128(fee));
                let promise = self
                    .transfer(player_a.clone(), U128(reward - fee));

                self.duels.insert(duel_id.0, duel);
                return PromiseOrValue::Promise(promise);
            } else if damage_a < damage_b {
                let player_b = duel.player_b.clone().unwrap();
                let reward = duel.stake.0 * 2;
                let fee = reward / 10;
                duel.winner = Some(Winner::PlayerB);
                env::log_str(&format!(
                    "Duel {} finished! Result: {} won!",
                    duel.id.0, player_b
                ));

                self.burn(U128(fee));
                let promise = self
                    .transfer(player_b.clone(), U128(reward - fee));

                self.duels.insert(duel_id.0, duel);
                return PromiseOrValue::Promise(promise);
            } else {
                let player_a = duel.player_a.clone();
                let player_b = duel.player_b.clone().unwrap();
                let stake = duel.stake;
                duel.winner = Some(Winner::Draw);
                env::log_str(&format!("Duel {} finished! Result: draw!", duel.id.0));
                
                self
                    .transfer(player_a, stake);
                let promise = self.transfer(player_b, stake);
                
                self.duels.insert(duel_id.0, duel);
                return PromiseOrValue::Promise(promise);
            }
        }

        self.duels.insert(duel_id.0, duel);

        PromiseOrValue::Value(damage)
    }

    #[payable]
    pub fn cancel_duel(&mut self, duel_id: U128) -> Promise {
        assert!(
            env::attached_deposit() == NearToken::from_yoctonear(1),
            "This function requires exactly 1 yoctoNEAR to be attached for security purposes."
        );

        let sender = env::predecessor_account_id();
        let current_time = env::block_timestamp();
        let duel = self.duels.get(&duel_id.0).expect("Duel not found");

        if duel.player_b.is_none() {
            assert!(sender == duel.player_a, "Sender must be player.");
            assert!(
                current_time >= duel.creation_time + (24 * 60 * 60 * 1_000_000_000),
                "You must wait 24 hours to cancel an unaccepted duel."
            );

            let player_a = duel.player_a.clone();
            let promise = self.transfer(player_a.clone(), duel.stake);
            self.duels.remove(&duel_id.0);

            env::log_str(&format!(
                "Duel {} canceled. Stake refunded to {}.",
                duel_id.0, player_a
            ));
            return promise;
        }

        let is_player_a_turn = duel.turns.len() % 2 == 0;
        let opponent = if is_player_a_turn {
            duel.player_b.as_ref().unwrap()
        } else {
            &duel.player_a
        };

        assert!(
            sender == *opponent,
            "Only the opponent can cancel if no move is made."
        );

        let last_turn_time = duel
            .turns
            .iter()
            .last()
            .map(|turn| turn.creation_time)
            .unwrap_or(duel.start_time.expect("Duel has not begun."));
        assert!(
            current_time >= last_turn_time + (48 * 60 * 60 * 1_000_000_000),
            "You must wait 48 hours since the last move before canceling an ongoing duel."
        );

        let player_a = duel.player_a.clone();
        let player_b = duel.player_b.clone().unwrap();
        let stake = duel.stake;
        let promise = if is_player_a_turn {
            self.transfer(player_a, stake);
            self
                .transfer(player_b, stake)
        } else {
            self.transfer(player_b, stake);
            self
                .transfer(player_a, stake)
        };

        self.duels.remove(&duel_id.0);
        env::log_str(&format!("Duel {} canceled due to inactivity.", duel_id.0));

        promise
    }

    pub fn set_roast(&mut self, duel_id: U128, turn: usize, roast_cid: String) {
        let sender = env::predecessor_account_id();
        assert!(sender == self.admin_id, "Sender must be admin.");

        let duel = self.duels.get_mut(&duel_id.0).expect("Duel not found.");
        assert!(turn < duel.turns.len(), "Turn has not been taken.");
        assert!(duel.turns[turn].roast_cid.is_none(), "Roast already set.");

        duel.turns[turn].roast_cid = Some(roast_cid);
    }

    pub fn ft_on_transfer(
        &mut self,
        sender_id: AccountId,
        amount: U128,
        msg: String,
    ) -> PromiseOrValue<U128> {
        let token_in = env::predecessor_account_id();
        assert!(
            token_in == self.ft_contract,
            "{}",
            "The token is not supported"
        );

        let balance = self.stakes.entry(sender_id.clone()).or_insert(0);
        *balance += amount.0;
        self.total_stake += amount.0;

        let msg = serde_json::from_str::<Msg>(&msg);
        match msg {
            Ok(Msg::CreateDuel { figure }) => {
                self._create_duel(sender_id, figure, amount);
            }
            Ok(Msg::AcceptDuel { duel_id, figure }) => {
                self._accept_duel(sender_id, duel_id, figure);
            }
            _ => (),
        }

        PromiseOrValue::Value(U128(0))
    }

    pub fn withdraw(&mut self, amount: U128) -> Promise {
        let sender = env::predecessor_account_id();
        let balance = self.stakes.entry(sender.clone()).or_insert(0);
        assert!(*balance >= amount.0, "Insufficient balance");

        *balance -= amount.0;
        self.transfer(sender, amount)
    }

    pub fn burn_excess(&mut self) -> Promise {
        ext_ft_contract::ext(self.ft_contract.clone())
            .ft_balance_of(env::current_account_id())
            .then(Self::ext(env::current_account_id()).on_burn_excess())
    }

    #[private]
    pub fn on_burn_excess(
        &mut self,
        #[callback_result] balance: Result<U128, PromiseError>,
    ) -> Option<Promise> {
        if let Ok(balance) = balance {
            if balance.0 > self.total_stake {
                return Some(self.burn(U128(balance.0 - self.total_stake)));
            }
        }
        None
    }

    fn _create_duel(&mut self, sender: AccountId, figure: HistoricalFigure, stake: U128) -> U128 {
        let balance = self.stakes.entry(sender.clone()).or_insert(0);

        assert!(stake >= U128(MIN_STAKE), "Minimum stake required.");
        assert!(*balance >= stake.0, "Insufficient balance");

        *balance -= stake.0;

        let duel_id = self.next_duel_id;
        let duel = Duel {
            id: U128(duel_id),
            creation_time: env::block_timestamp(),
            start_time: None,
            stake,
            player_a: sender.clone(),
            figure_a: figure,
            player_b: None,
            figure_b: None,
            turns: Vec::new(),
            winner: None,
        };

        self.duels.insert(duel_id, duel);
        self.next_duel_id += 1;

        env::log_str(&format!("Duel {} created by {}.", duel_id, sender));
        U128(duel_id)
    }

    fn _accept_duel(&mut self, sender: AccountId, duel_id: U128, figure: HistoricalFigure) {
        let duel = self.duels.get_mut(&duel_id.0).expect("Duel not found.");
        let balance = self.stakes.entry(sender.clone()).or_insert(0);

        assert!(duel.player_b.is_none(), "Duel already accepted.");
        assert!(sender != duel.player_a, "Account is already participating.");
        assert!(
            figure != duel.figure_a,
            "Historical figure already selected."
        );
        assert!(*balance >= duel.stake.0, "Insufficient balance");

        *balance -= duel.stake.0;

        duel.start_time = Some(env::block_timestamp());
        duel.player_b = Some(sender.clone());
        duel.figure_b = Some(figure);

        env::log_str(&format!("Duel {} accepted by {}.", duel_id.0, sender));
    }

    fn transfer(&mut self, sender: AccountId, amount: U128) -> Promise {
        self.total_stake -= amount.0;
        ext_ft_contract::ext(self.ft_contract.clone())
            .with_attached_deposit(NearToken::from_yoctonear(1))
            .ft_transfer(sender, amount, None)
    }

    fn burn(&mut self, amount: U128) -> Promise {
        ext_ft_contract::ext(self.ft_contract.clone())
            .with_attached_deposit(NearToken::from_yoctonear(1))
            .ft_burn(amount)
    }
}
