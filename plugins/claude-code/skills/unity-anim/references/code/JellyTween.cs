using DG.Tweening;
using UnityEngine;

namespace JuicyAnim
{
    public static class JellyTween
    {
        public static Sequence Lift(Transform view, JellyLiftSettings s)
        {
            return DOTween.Sequence()
                .Append(view.DOScale(s.Squash, s.SquashDuration).SetEase(s.SquashCurve))
                .Append(DOVirtual.Float(0f, 1f, s.RiseDuration, t =>
                {
                    view.localPosition = Vector3.up * (s.RiseCurve.Evaluate(t) * s.Height);
                    Vector3 air = Vector3.LerpUnclamped(Vector3.one, s.Stretch, s.StretchCurve.Evaluate(t));
                    view.localScale = Vector3.LerpUnclamped(s.Squash, air, Mathf.SmoothStep(0f, 1f, t));
                }).SetEase(Ease.Linear))
                .Append(view.DOScale(Vector3.one, s.SettleDuration).SetEase(s.SettleCurve));
        }

        public static Sequence Lower(Transform view, float fromHeight, JellyLandSettings s)
        {
            return DOTween.Sequence()
                .Append(DOVirtual.Float(0f, 1f, s.FallDuration, t =>
                {
                    float drop = s.FallCurve.Evaluate(t);
                    view.localPosition = Vector3.up * ((1f - drop) * fromHeight);
                    view.localScale = Vector3.LerpUnclamped(Vector3.one, s.Stretch, drop);
                }).SetEase(Ease.Linear))
                .Append(view.DOScale(s.Land, s.LandDuration).SetEase(s.LandCurve))
                .Append(view.DOScale(Vector3.one, s.RecoverDuration).SetEase(s.RecoverCurve));
        }

        public static Tween Punch(Transform view, JellyPunchSettings s)
        {
            return DOVirtual.Float(0f, 1f, s.Duration,
                    t => view.localScale = Vector3.LerpUnclamped(s.Bulge, Vector3.one, s.Curve.Evaluate(t)))
                .SetEase(Ease.Linear);
        }

        public static Sequence Hop(Transform view, AdditiveOffset offset, Quaternion rest, JellyHopSettings s, float delay, TweenCallback atSwap)
        {
            return DOTween.Sequence()
                .AppendInterval(delay)
                .Append(view.DOScale(s.Squash, s.SquashDuration).SetEase(s.SquashCurve))
                .Append(DOVirtual.Float(0f, 1f, s.AirDuration, t =>
                {
                    offset.Set(Vector3.up * (s.HeightCurve.Evaluate(t) * s.Height));
                    view.localRotation = rest * Quaternion.Euler(0f, s.Spin * s.SpinCurve.Evaluate(t), 0f);
                    Vector3 air = Vector3.LerpUnclamped(Vector3.one, s.Stretch, s.StretchCurve.Evaluate(t));
                    view.localScale = Vector3.LerpUnclamped(s.Squash, air, Mathf.SmoothStep(0f, 1f, t * 5f));
                }).SetEase(Ease.Linear))
                .Append(view.DOScale(s.Land, s.LandDuration).SetEase(s.LandCurve))
                .Append(view.DOScale(Vector3.one, s.RecoverDuration).SetEase(s.RecoverCurve))
                .InsertCallback(delay + s.SquashDuration + s.AirDuration * s.SwapAt, atSwap);
        }
    }
}
