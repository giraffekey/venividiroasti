use crate::figures::HistoricalFigure;
use near_sdk::json_types::U128;
use near_sdk::{near, AccountId};

#[near(serializers = [json, borsh])]
#[derive(Copy, Clone)]
pub enum RoastStyle {
    Witty,
    Brutal,
    Strategic,
    Mocking,
}

impl RoastStyle {
    pub fn is_strong_against(&self, other: RoastStyle) -> bool {
        match (self, other) {
            (RoastStyle::Witty, RoastStyle::Brutal) => true,
            (RoastStyle::Brutal, RoastStyle::Strategic) => true,
            (RoastStyle::Strategic, RoastStyle::Mocking) => true,
            (RoastStyle::Mocking, RoastStyle::Witty) => true,
            _ => false,
        }
    }

    pub fn is_weak_against(&self, other: RoastStyle) -> bool {
        match (self, other) {
            (RoastStyle::Witty, RoastStyle::Mocking) => true,
            (RoastStyle::Brutal, RoastStyle::Witty) => true,
            (RoastStyle::Strategic, RoastStyle::Brutal) => true,
            (RoastStyle::Mocking, RoastStyle::Strategic) => true,
            _ => false,
        }
    }
}

#[near(serializers = [json, borsh])]
#[derive(Copy, Clone)]
pub enum Winner {
    PlayerA,
    PlayerB,
    Draw,
}

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct Turn {
    pub creation_time: u64,
    pub damage: u8,
    pub style: RoastStyle,
    pub roast_cid: Option<String>,
}

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct Duel {
    pub id: U128,
    pub creation_time: u64,
    pub start_time: Option<u64>,
    pub stake: U128,
    pub player_a: AccountId,
    pub figure_a: HistoricalFigure,
    pub player_b: Option<AccountId>,
    pub figure_b: Option<HistoricalFigure>,
    pub turns: Vec<Turn>,
    pub winner: Option<Winner>,
}
