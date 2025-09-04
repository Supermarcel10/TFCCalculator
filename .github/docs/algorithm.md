# TerraFirmaCraft Metal Calculator Algorithm

### Overview
This algorithm answers whether, given a target mB of a desired Output and an inventory of Minerals, the target mB of that desired Output can be produced while satisfying Component percentage thresholds.

If production is possible, the algorithm also provides a satisfying combination of Minerals and respective quantities.

### Terminology
**Stages of Calculation** = 
Minerals (stage 1) --> Components (stage 2) --> Output (stage 3)

**Mineral** = the raw material, e.g. Medium Copper, Large Copper, Small Cassiterite
- 1 unit of a Mineral "yields" a certain amount of mB, e.g. 1 unit of Small Cassiterite yields 16 mB
- All Minerals "produce" a certain Component - different Minerals can produce the same Component

**Component** = an intermediary stage of refinement, e.g. Tin, Copper
- The total mB for a Component can formed from different Minerals, e.g. 60mB of Copper can be formed from 1 unit of Medium Copper (24 mB) and 1 unit of Large Copper (36 mB)
- Multiple Components combine to form an Output

**Output** = the refined combination of multiple Components, e.g. Bronze
- Quantified by a singular mB value, e.g 432 mB, which is reached by mB contributions from multiple Components
- Components must contribute to the Output's mB value within specified percentage thresholds, e.g. 8-12% Tin, 88-92% Copper

**Chunk** = represents an "item" within the context of the Knapsack Problem
- An object with 3 fields: yield, mineral and quantity
- `yield` = how much mB is produced by 1 unit of the Mineral
- `mineral` = the Mineral this chunk belongs to
- `quantity` = how many units of the Mineral this chunk represents
- `yield * quantity` = the chunk's value in mB - represents the "weight" in the Knapsack Problem

### Worked Example
**Input:**
- Target mB = 432 mB
- Desired Output = Bronze
- Inventory of Minerals:
    - 3 units of Tin
    - 7 units of Medium Copper
    - 6 units of Large Copper

**Minerals (stage 1):**
- 3 units of Small Cassiterite, each yield 16 mB
- 7 units of Medium Copper, each yield 24 mB
- 6 units of Large Copper, each yield 36 mB

**Components (stage 2):**
- 48 mB of Tin (formed from 3 units of Small Cassiterite)
- 384 mB of Copper (formed from 7 units of Medium Copper and 6 units of Large Copper)

**Output (stage 3):**
- 432 mB of Bronze (formed from 48 mB of Tin and 384 mB of Copper)
- Tin's mB contribution is within the 8-12% threshold (11.1%)
- Copper's mB contribution within the 88-92% threshold (88.9%)

### Intuition
1. Subset Sum Problem: at its core, our problem involves asking whether or not we can reach a target integer (the target mB of the desired Output) using a subset of a list of integers (a list of Minerals with yield values) - this is the Subset Sum Problem.
2. Bounded Knapsack Problem: for each item (Mineral of quantity `q`), we can choose up to `q` copies of that item to reach the weight capacity (target mB).
3. DFS and backtracking: we need to explore all possible combinations of mB contributions across Components - this requires exploring one branch (unique choice of mB contributions) to completion, then backtracking to explore new branches.

### Approach
We can divide the algorithm into 3 building blocks:
1. Binary decomposition: reduce a Bounded Knapsack item (with a certain quantity `q`) to a `~log₂(q)` set of 0/1 Knapsack items. Applied to this problem, we reduce a Mineral within a Component with a quantity `q` as a `~log₂(q)` set of chunks, from which we can represent any quantity of that Mineral from 0 to `q`.
2. Per-Component Subset Sum DP: for each Component, we take the union of all chunks (from all Minerals) in that Component, then run Subset Sum DP to construct a list of potential mB contributions to the desired Output from that Component.
3. Cross-Component well-pruned DFS: using the list of potential mB contributions from each Component, we pick one "candidate" (mB contributions that lie within that Component's percentage threshold) per Component such that the total mB is equal to the target mB (if such a choice exists).

Each building block is explored in detail below.

### The Subset Sum Problem
*"Given a list of integers and a target integer, does there exist a sublist whose values sum to the target integer?"*

When we apply the traditional Subset Sum Problem to our problem (we apply it per-Component), a "list of integers" maps to a list of chunk values in mB. The "target integer" maps to the smaller of the target mB of the desired Output, and the total MB available for a given Component.

We are tackling a modified Subset Sum Problem, where there are multiple lists (one for each Component) and for each list you must pick a subset whose sum lies within a given window (the percentage thresholds). Let there be three lists (`list X`, `list Y`, `list Z`), with chunk values in mB. Let the allowed mB windows be `[A_X, B_X]`, `[A_Y, B_Y]`, `[A_Z, B_Z]`, and let the Output target be `T`. We must:
- pick a subset from list X whose sum is in `[A_X, B_X]`
- pick a subset from list Y whose sum is in `[A_Y, B_Y]`
- pick a subset from list Z whose sum is in `[A_Z, B_Z]`
- ensure the total sum across all lists equals `T`

The modified Subset Sum Problem applied to our problem can be stated as the following:
*"Given multiple lists of integers, a target integer, and a sum window for each list, does there exist a choice of one sublist from each list such that the combined sum of the sublists equals the target integer and the sum of each sublist satisfies its respective sum window?"*

The Subset Sum Problem has a well-known dynamic programming (DP) solution which we use as the basis for this algorithm.

A significant optimization we make is the elegant and efficient handling of multiplicities (quantities greater than 1) through binary decomposition. In our problem, multiplicities map to the idea that we have multiple units of the same Mineral.

**Note:** The Subset Sum DP algorithm is actually very similar to the 0/1 Knapsack DP solution, as the 0/1 Knapsack DP is a more general form of the Subset Sum DP. You can model the Subset Sum Problem using the 0/1 Knapsack DP by just setting the value of each item to equal its weight (in practice, we use a boolean-based DP table instead). This effectively turns an optimization problem (0/1 Knapsack) into a feasibility problem (Subset Sum). 

### The Knapsack Problem
*"Given a set of items, each with a weight and a value, select a subset of items that maximizes total value without exceeding the knapsack's weight capacity"* 

In this problem, an "item" is represented by a chunk, and "weight" is represented by the `yield * quantity` of that chunk. However, "value" is not used in this algorithm as we are not attempting to maximise anything. As this is a decision problem (not an optimization problem), we can simply set "value" to equal "weight" (similar to how we can model Subset Sum using the 0/1 Knapsack DP solution). This feasibility version of the Knapsack Problem (i.e. the Subset Sum Problem) is applied on a per-Component basis. The "weight capacity" is represented by the smaller of the target mB of the desired Output, and the total MB available for a given Component. 

By setting "value" to equal "weight", we are simply asking *"What weights can we produce without exceeding the weight capacity? Can we reach the weight capacity exactly?"*.

The Bounded Knapsack Problem introduces the constraint that there is a maximum number of identical (same value and weight) copies for each item, i.e. multiplicity.

The benefit of modelling this problem as a Bounded Knapsack problem is that we can utilise a common technique to efficiently solve Bounded Knapsack problems: binary decomposition.

### Binary Decomposition
The 0/1 Knapsack Problem differs from the Bounded Knapsack Problem by disallowing multiplicities greater than 1, i.e. copies of items are not allowed. You can either use the item (1) or not use it (0). Note that although two items may have the same value and weight, they are still separate item instances.

Binary decomposition is a technique used to solve a Bounded Knapsack problem as a 0/1 Knapsack Problem. It does this by reducing a Bounded Knapsack item (with a certain quantity `q`) to a `~log₂(q)` set of 0/1 Knapsack items. We represent a quantity `q` of an item with "chunks" of sizes ascending in powers of 2: `1, 2, 4, 8, ..., remainder` - this allows us to represent any quantity from 0 to `q`. Instead of naively making `q` copies of an item, we use binary decomposition to make `~log₂(q)` chunks. 

We still use the same Subset Sum DP core, but we don't naively feed `q` identical copies into it, taking around `O(cap * Σ qᵢ)` time for each Component. Instead, we use binary decomposition to feed `~log₂(q)` non-identical chunks, taking around `O(cap * Σ log₂(qᵢ))` for each Component. 

Note that we apply binary decomposition to every Mineral within a Component, then we run the Subset Sum DP over the union of all chunks (from all Minerals) in that Component.

Also note that `cap` is the per-Component target integer (or weight capacity in Knapsack terms). In addition, `qᵢ` represent the number of units of a distinct Mineral within a Component. For example, Medium Copper and Large Copper both produce Copper. If we have 7 units of Medium Copper and 6 units of Large Copper, then `q₁ = 7` and `q₂ = 6`. Also note that the space complexity remains unchanged with `O(cap)` per Component.

### Cross-Component DFS
After we use Subset Sum DP (aided by binary decomposition) on each Component, we have a list of potential mB contributions for each Component (derived from the Minerals in each Component, and their respective quantities and yields).

For each Component, the "candidates" are the mB contributions that lie within that Component's percentage threshold. We pick one candidate per Component such that the total mB is equal to the target mB.

This is achieved using DFS to explore all possible combinations, and we use various methods to prune the tree as much as possible, including:
- Early feasibility checks (before DFS)
    - If there are any Components with no candidates, fail immediately.
    - If the sum of the minimum mB contributions per Component is greater than the target mB, fail immediately
    - If the sum of the maximum mB contributions per Component is less than the target mB, fail immediately.
- Remove duplicates and sort each Component's candidates (before DFS)
    - Avoid redundant branches and speed up membership checks to O(1).
- Sorting Components by fewest candidates first
    - Allows contradictions to surface earlier.
- Branch-and-bound with residual lower/upper bound pruning
    - During DFS, compute a lower bound and an upper bound for each depth in O(1) time using precomputed suffix sums.
    - Prune any branch if even the best (largest) case can't reach the target, or if the worst (smallest) case still exceeds the target.
    - `suffixMin[i]` is the sum of the smallest candidates from Components `[i...end]`.
    - `suffixMax[i]` is the sum of the largest candidates from Components `[i...end]`.
    - Prune a branch if `sumSoFar + suffixMin[i] > target`, since we exceed the target mB even with the minimums.
    - Prune a branch if `sumSoFar + suffixMax[i] < target`, since we fail to reach the target mB even with the maximums.
- Greedy ordering of candidates (heuristic)
    - Compute `need` for the current Component such that `need = target - sumSoFar - suffixMin[i+1]`.
    - `suffixMin[i+1]` is the sum of the smallest candidates from all Components after the current Component.
    - Try the candidates for the current Component that are closest to `need` first.
- O(1) check for final Component
    - At the final Component, we can compute `required = target - sumSoFar` and do an O(1) membership check using a Set (we removed duplicates before DFS) instead of looping.
- Memoization of states
    - We use memoization to skip revisiting the same `(componentIndex, sumSoFar)` state.

This problem usually uses few Components and narrow percentage thresholds, so the cross-Component DFS is very quick relative to the per-Component Subset Sum DP.
