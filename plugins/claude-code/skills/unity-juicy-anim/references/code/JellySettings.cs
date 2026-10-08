using System;
using UnityEngine;

namespace JuicyAnim
{
    [Serializable]
    public class JellyLiftSettings
    {
        [SerializeField] private Vector3 squash = new(1.2f, 0.75f, 1.2f);
        [SerializeField] private float squashDuration = 0.08f;
        [SerializeField] private AnimationCurve squashCurve = CurvePresets.OutQuad();
        [SerializeField] private float height = 1.2f;
        [SerializeField] private float riseDuration = 0.2f;
        [SerializeField] private AnimationCurve riseCurve = CurvePresets.OutQuad();
        [SerializeField] private Vector3 stretch = new(0.85f, 1.25f, 0.85f);
        [SerializeField] private AnimationCurve stretchCurve = CurvePresets.OutQuad();
        [SerializeField] private float settleDuration = 0.3f;
        [SerializeField] private AnimationCurve settleCurve = CurvePresets.Wobble();

        public float LiftTime => squashDuration + riseDuration + settleDuration;

        public Vector3 Squash => squash;
        public float SquashDuration => squashDuration;
        public AnimationCurve SquashCurve => squashCurve;
        public float Height => height;
        public float RiseDuration => riseDuration;
        public AnimationCurve RiseCurve => riseCurve;
        public Vector3 Stretch => stretch;
        public AnimationCurve StretchCurve => stretchCurve;
        public float SettleDuration => settleDuration;
        public AnimationCurve SettleCurve => settleCurve;
    }

    [Serializable]
    public class JellyLandSettings
    {
        [SerializeField] private float fallDuration = 0.15f;
        [SerializeField] private AnimationCurve fallCurve = CurvePresets.InQuad();
        [SerializeField] private Vector3 stretch = new(0.85f, 1.25f, 0.85f);
        [SerializeField] private Vector3 land = new(1.25f, 0.7f, 1.25f);
        [SerializeField] private float landDuration = 0.06f;
        [SerializeField] private AnimationCurve landCurve = CurvePresets.OutQuad();
        [SerializeField] private float recoverDuration = 0.35f;
        [SerializeField] private AnimationCurve recoverCurve = CurvePresets.Wobble();

        public float FallDuration => fallDuration;
        public AnimationCurve FallCurve => fallCurve;
        public Vector3 Stretch => stretch;
        public Vector3 Land => land;
        public float LandDuration => landDuration;
        public AnimationCurve LandCurve => landCurve;
        public float RecoverDuration => recoverDuration;
        public AnimationCurve RecoverCurve => recoverCurve;
    }

    [Serializable]
    public class JellyPunchSettings
    {
        [SerializeField] private Vector3 bulge = new(1.3f, 0.8f, 1.3f);
        [SerializeField] private float duration = 0.3f;
        [SerializeField] private AnimationCurve curve = CurvePresets.Wobble();

        public Vector3 Bulge => bulge;
        public float Duration => duration;
        public AnimationCurve Curve => curve;
    }

    [Serializable]
    public class JellyHopSettings
    {
        [SerializeField] private Vector3 squash = new(1.2f, 0.75f, 1.2f);
        [SerializeField] private float squashDuration = 0.08f;
        [SerializeField] private AnimationCurve squashCurve = CurvePresets.OutQuad();
        [SerializeField] private float height = 1f;
        [SerializeField] private float airDuration = 0.4f;
        [SerializeField] private AnimationCurve heightCurve = CurvePresets.Arc();
        [SerializeField, Range(0f, 1f)] private float swapAt = 0.5f;
        [SerializeField] private float spin = 360f;
        [SerializeField] private AnimationCurve spinCurve = CurvePresets.Linear();
        [SerializeField] private Vector3 stretch = new(0.85f, 1.25f, 0.85f);
        [SerializeField] private AnimationCurve stretchCurve = CurvePresets.RiseAndFall();
        [SerializeField] private Vector3 land = new(1.25f, 0.7f, 1.25f);
        [SerializeField] private float landDuration = 0.06f;
        [SerializeField] private AnimationCurve landCurve = CurvePresets.OutQuad();
        [SerializeField] private float recoverDuration = 0.35f;
        [SerializeField] private AnimationCurve recoverCurve = CurvePresets.Wobble();

        public Vector3 Squash => squash;
        public float SquashDuration => squashDuration;
        public AnimationCurve SquashCurve => squashCurve;
        public float Height => height;
        public float AirDuration => airDuration;
        public AnimationCurve HeightCurve => heightCurve;
        public float SwapAt => swapAt;
        public float Spin => spin;
        public AnimationCurve SpinCurve => spinCurve;
        public Vector3 Stretch => stretch;
        public AnimationCurve StretchCurve => stretchCurve;
        public Vector3 Land => land;
        public float LandDuration => landDuration;
        public AnimationCurve LandCurve => landCurve;
        public float RecoverDuration => recoverDuration;
        public AnimationCurve RecoverCurve => recoverCurve;
    }
}
