# Test patterns that keep the GDD, the tuning and the levels honest

Generalized from Snap Jam 3D (`Assets/SnapJam/Tests/EditMode/`). Replace `MyGame` with the game's namespace. These
tests are why "every number in the GDD matches code" and "every level is clearable" were facts, not claims.

## 1. One tuning class
Every gameplay number is a `const` in `public static class MyGameTuning`, grouped by system. Views and models read
from it. Nothing is duplicated in the inspector unless the test also covers it.

## 2. GDD ↔ tuning consistency
The GDD has an appendix table with one row per constant, written exactly as `| \`Name\` | value |`. Floats are formatted
with `0.####` and the invariant culture.

```csharp
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Reflection;
using NUnit.Framework;
using UnityEngine;

namespace MyGame.Tests
{
    public sealed class GddTuningConsistencyTests
    {
        private static string document;

        private static string Document
        {
            get
            {
                if (document == null)
                {
                    string root = Directory.GetParent(Application.dataPath).FullName;
                    document = File.ReadAllText(Path.Combine(root, "Docs", "MyGame_GDD.md"));
                }
                return document;
            }
        }

        public static IEnumerable<string> TuningConstants()
        {
            FieldInfo[] fields = typeof(MyGameTuning).GetFields(BindingFlags.Public | BindingFlags.Static);
            for (int i = 0; i < fields.Length; i++)
            {
                if (fields[i].IsLiteral)
                {
                    yield return fields[i].Name;
                }
            }
        }

        public static string Format(object value)
        {
            if (value is float number)
            {
                return number.ToString("0.####", CultureInfo.InvariantCulture);
            }
            return System.Convert.ToString(value, CultureInfo.InvariantCulture);
        }

        [TestCaseSource(nameof(TuningConstants))]
        public void TuningConstantIsDocumentedWithExactValue(string name)
        {
            object value = typeof(MyGameTuning).GetField(name).GetRawConstantValue();
            StringAssert.Contains("| `" + name + "` | " + Format(value) + " |", Document);
        }
    }
}
```

Add more checks the same way:
- **Level table rows:** build `| {n} | {bands} | {items} | {colors} | {layers} | {frozen} |` from
  `LevelLibrary.Get(n)` and assert that the GDD contains it.
- **Quoted values:** assert that prose numbers appear, e.g. `"460 Hz"` or `"520 → 50 Hz"`, built from the
  constants.

## 3. Level invariants
- `LevelLibrary.Count` equals `MyGameTuning.LevelCount`, and `Get(N+1)` wraps to level 1.
- Each level is well formed: indices in range, hint present, obstacle parameters valid.
- Each color's item count is a multiple of the match count.
- Onboarding levels (1-5) use only the basic mechanic and at most 3 colors.
- Each mechanic first appears at the level the GDD rollout says (`FirstLevel(predicate) == 6`, ...).

## 4. Solver proof
A depth-first solver with a bitmask memo over "which pieces are gone" (the board is at most 64 pieces) replays the
real rules through `GameSession`. That way the test checks the shipped rules, not a copy of them.

```csharp
[TestCaseSource(typeof(LevelLibraryTests), nameof(LevelLibraryTests.AllLevels))]
public void LevelIsSolvableWithinTray(int number)
{
    LevelDefinition level = LevelLibrary.Get(number);
    SolveResult result = LevelSolver.Solve(level);
    Assert.IsTrue(result.Solvable, "level " + number);
    Assert.IsFalse(result.LimitReached);
    GameSession replay = new GameSession(level);
    for (int i = 0; i < result.Order.Length; i++)
    {
        Assert.IsTrue(replay.CanSnap(result.Order[i]));
        replay.CommitSnap(result.Order[i]);
        Assert.LessOrEqual(replay.Tray.Count, replay.Tray.UsableCapacity);
    }
    Assert.AreEqual(SessionOutcome.Won, replay.Outcome);
}
```

Also add:
- the solver reports an unsolvable hand-made level (it can fail);
- levels after onboarding have at least one losing line (they are not trivial).

## 5. Rule models get unit tests first
For the layering/blocking predicate, the tension phases (including the exact break point), the tray (grouped insert,
triple clear, frozen slots, full detection), progression (save on win), and win/lose: write the model and its tests
before the view. When feedback changes a rule (e.g. "snap the moment stretch reaches the threshold"), change the model
and add a test for the new edge before touching the view.
