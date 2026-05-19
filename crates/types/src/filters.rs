use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub enum CreationSelectionFilter {
    #[default]
    All,
    Metals,
    Alloys,
}
