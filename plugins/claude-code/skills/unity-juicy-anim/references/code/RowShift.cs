using System;
using System.Collections.Generic;
using DG.Tweening;
using UnityEngine;

namespace JuicyAnim
{
    [Serializable]
    public class RowShiftSettings
    {
        [SerializeField, Min(0f)] private float shiftDuration = 0.3f;
        [SerializeField, Min(0f)] private float stagger = 0.04f;
        [SerializeField] private AnimationCurve shiftCurve = CurvePresets.OutQuad();
        [SerializeField, Min(0f)] private float enterOffset = 3f;
        [SerializeField, Min(0f)] private float enterDuration = 0.2f;
        [SerializeField] private AnimationCurve enterCurve = CurvePresets.OutBack();

        public float ShiftDuration => shiftDuration;
        public float Stagger => stagger;
        public AnimationCurve ShiftCurve => shiftCurve;
        public float EnterOffset => enterOffset;
        public float EnterDuration => enterDuration;
        public AnimationCurve EnterCurve => enterCurve;
    }

    public static class RowShift
    {
        public static Vector3 Position(int index, int count, float cellSize) =>
            new((index - (count - 1) * 0.5f) * cellSize, 0f, 0f);

        public static void Snap(IReadOnlyList<Transform> row, int count, float cellSize)
        {
            for (int i = 0; i < count; i++)
            {
                row[i].DOKill();
                row[i].localPosition = Position(i, count, cellSize);
            }
        }

        public static void Play(IReadOnlyList<Transform> row, int count, int firstNew, float cellSize, RowShiftSettings s)
        {
            for (int i = 0; i < count; i++)
            {
                Transform slot = row[i];
                Vector3 target = Position(i, count, cellSize);
                bool entering = i >= firstNew;

                slot.DOKill();
                if (entering) slot.localPosition = target + Vector3.right * (s.EnterOffset * cellSize);

                slot.DOLocalMove(target, entering ? s.EnterDuration : s.ShiftDuration)
                    .SetDelay(i * s.Stagger)
                    .SetEase(entering ? s.EnterCurve : s.ShiftCurve)
                    .SetTarget(slot)
                    .SetLink(slot.gameObject);
            }
        }
    }
}
