use near_sdk::near;
use strum_macros::EnumIter;

#[near(serializers = [json, borsh])]
#[derive(Copy, Clone, PartialEq, Eq, Hash, EnumIter)]
pub enum HistoricalFigure {
    JuliusCaesar,
    WilliamShakespeare,
    GenghisKhan,
    NapoleonBonaparte,
    MarkTwain,
    SunTzu,
    Socrates,
    WinstonChurchill,
    MarieAntoinette,
    LeonardoDaVinci,
    OscarWilde,
    AttilaTheHun,
    TheodoreRoosevelt,
    BenjaminFranklin,
    HannibalBarca,
    Confucius,
    VladTheImpaler,
    NiccoloMachiavelli,
    KarlMarx,
    FriedrichNietzsche,
    JoanOfArc,
    AndrewJackson,
    OttoVonBismarck,
    SalvadorDali,
    HarrietTubman,
    NelsonMandela,
    JohnFKennedy,
    MartinLutherKingJr,
    MalcolmX,
    FrederickDouglass,
}

#[near(serializers = [json, borsh])]
#[derive(Copy, Clone)]
pub struct Stats {
    pub wit: u8,
    pub brutality: u8,
    pub strategy: u8,
    pub mockery: u8,
}

impl HistoricalFigure {
    pub fn stats(self) -> Stats {
        match self {
            Self::JuliusCaesar => Stats {
                wit: 5,
                brutality: 6,
                strategy: 6,
                mockery: 3,
            },
            Self::WilliamShakespeare => Stats {
                wit: 9,
                brutality: 2,
                strategy: 5,
                mockery: 4,
            },
            Self::GenghisKhan => Stats {
                wit: 2,
                brutality: 10,
                strategy: 6,
                mockery: 2,
            },
            Self::NapoleonBonaparte => Stats {
                wit: 4,
                brutality: 4,
                strategy: 9,
                mockery: 3,
            },
            Self::MarkTwain => Stats {
                wit: 10,
                brutality: 1,
                strategy: 4,
                mockery: 5,
            },
            Self::SunTzu => Stats {
                wit: 5,
                brutality: 2,
                strategy: 10,
                mockery: 3,
            },
            Self::Socrates => Stats {
                wit: 8,
                brutality: 1,
                strategy: 6,
                mockery: 5,
            },
            Self::WinstonChurchill => Stats {
                wit: 6,
                brutality: 3,
                strategy: 5,
                mockery: 6,
            },
            Self::MarieAntoinette => Stats {
                wit: 3,
                brutality: 4,
                strategy: 4,
                mockery: 9,
            },
            Self::LeonardoDaVinci => Stats {
                wit: 6,
                brutality: 2,
                strategy: 9,
                mockery: 3,
            },
            Self::OscarWilde => Stats {
                wit: 9,
                brutality: 1,
                strategy: 5,
                mockery: 5,
            },
            Self::AttilaTheHun => Stats {
                wit: 1,
                brutality: 10,
                strategy: 5,
                mockery: 4,
            },
            Self::TheodoreRoosevelt => Stats {
                wit: 4,
                brutality: 8,
                strategy: 5,
                mockery: 3,
            },
            Self::BenjaminFranklin => Stats {
                wit: 7,
                brutality: 2,
                strategy: 7,
                mockery: 4,
            },
            Self::HannibalBarca => Stats {
                wit: 3,
                brutality: 5,
                strategy: 10,
                mockery: 2,
            },
            Self::Confucius => Stats {
                wit: 9,
                brutality: 1,
                strategy: 6,
                mockery: 4,
            },
            Self::VladTheImpaler => Stats {
                wit: 2,
                brutality: 9,
                strategy: 5,
                mockery: 4,
            },
            Self::NiccoloMachiavelli => Stats {
                wit: 5,
                brutality: 2,
                strategy: 9,
                mockery: 4,
            },
            Self::KarlMarx => Stats {
                wit: 6,
                brutality: 3,
                strategy: 6,
                mockery: 5,
            },
            Self::FriedrichNietzsche => Stats {
                wit: 5,
                brutality: 4,
                strategy: 5,
                mockery: 6,
            },
            Self::JoanOfArc => Stats {
                wit: 4,
                brutality: 7,
                strategy: 5,
                mockery: 4,
            },
            Self::AndrewJackson => Stats {
                wit: 3,
                brutality: 9,
                strategy: 4,
                mockery: 4,
            },
            Self::OttoVonBismarck => Stats {
                wit: 4,
                brutality: 5,
                strategy: 8,
                mockery: 3,
            },
            Self::SalvadorDali => Stats {
                wit: 7,
                brutality: 2,
                strategy: 4,
                mockery: 7,
            },
            Self::HarrietTubman => Stats {
                wit: 4,
                brutality: 6,
                strategy: 7,
                mockery: 3,
            },
            Self::NelsonMandela => Stats {
                wit: 6,
                brutality: 3,
                strategy: 7,
                mockery: 4,
            },
            Self::JohnFKennedy => Stats {
                wit: 6,
                brutality: 4,
                strategy: 6,
                mockery: 4,
            },
            Self::MartinLutherKingJr => Stats {
                wit: 8,
                brutality: 2,
                strategy: 6,
                mockery: 4,
            },
            Self::MalcolmX => Stats {
                wit: 7,
                brutality: 4,
                strategy: 5,
                mockery: 4,
            },
            Self::FrederickDouglass => Stats {
                wit: 7,
                brutality: 3,
                strategy: 6,
                mockery: 4,
            },
        }
    }
}
