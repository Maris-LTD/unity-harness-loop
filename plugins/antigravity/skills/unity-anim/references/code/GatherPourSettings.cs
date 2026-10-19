using System;
using UnityEngine;

namespace JuicyAnim
{
    [Serializable]
    public class GatherPourSettings
    {
        [Header("Wave")]
        [SerializeField, Min(0f)] private float rowStagger = 0.06f;
        [SerializeField, Min(0f)] private float columnStagger = 0.02f;

        [Header("Container")]
        [SerializeField] private GameObject container;
        [SerializeField, Min(0f)] private float containerScale = 1.6f;
        [SerializeField] private float containerHeight = 1.5f;
        [SerializeField, Min(0f)] private float popDuration = 0.3f;
        [SerializeField] private AnimationCurve popCurve = CurvePresets.Wobble();
        [SerializeField] private float shake = 15f;
        [SerializeField, Min(0f)] private float hideDuration = 0.2f;

        [Header("Inside")]
        [SerializeField, Min(0f)] private float insideScale = 0.45f;
        [SerializeField, Min(0f)] private float insideRadius = 0.22f;
        [SerializeField] private Vector2 insideHeight = new(0.2f, 0.6f);

        [Header("Fly")]
        [SerializeField] private Vector3 squash = new(1.2f, 0.75f, 1.2f);
        [SerializeField, Min(0f)] private float squashDuration = 0.08f;
        [SerializeField, Min(0f)] private float flyInDuration = 0.3f;
        [SerializeField, Min(0f)] private float flyOutDuration = 0.35f;
        [SerializeField] private AnimationCurve moveCurve = CurvePresets.OutQuad();
        [SerializeField] private AnimationCurve arcCurve = CurvePresets.Arc();
        [SerializeField] private float flyInArcHeight = 2f;
        [SerializeField] private float flyOutArcHeight = 0.4f;

        [Header("Mix")]
        [SerializeField, Min(0f)] private float mixDuration = 0.5f;
        [SerializeField] private float mixSpin = 720f;
        [SerializeField, Min(0f)] private float mixJitter = 0.2f;
        [SerializeField, Min(0f)] private float mixFrequency = 6f;

        [Header("Pour")]
        [SerializeField] private float pourTilt = 115f;
        [SerializeField, Min(0f)] private float tiltDuration = 0.3f;
        [SerializeField] private AnimationCurve tiltCurve = CurvePresets.OutBack();
        [SerializeField, Min(0f)] private float pourLead = 0.2f;

        [Header("Landing")]
        [SerializeField] private Vector3 land = new(1.25f, 0.7f, 1.25f);
        [SerializeField, Min(0f)] private float landDuration = 0.06f;
        [SerializeField, Min(0f)] private float recoverDuration = 0.35f;
        [SerializeField] private AnimationCurve recoverCurve = CurvePresets.Wobble();

        public float RowStagger => rowStagger;
        public float ColumnStagger => columnStagger;
        public GameObject Container => container;
        public float ContainerScale => containerScale;
        public float ContainerHeight => containerHeight;
        public float PopDuration => popDuration;
        public AnimationCurve PopCurve => popCurve;
        public float Shake => shake;
        public float HideDuration => hideDuration;
        public float InsideScale => insideScale;
        public float InsideRadius => insideRadius;
        public Vector2 InsideHeight => insideHeight;
        public Vector3 Squash => squash;
        public float SquashDuration => squashDuration;
        public float FlyInDuration => flyInDuration;
        public float FlyOutDuration => flyOutDuration;
        public AnimationCurve MoveCurve => moveCurve;
        public AnimationCurve ArcCurve => arcCurve;
        public float FlyInArcHeight => flyInArcHeight;
        public float FlyOutArcHeight => flyOutArcHeight;
        public float MixDuration => mixDuration;
        public float MixSpin => mixSpin;
        public float MixJitter => mixJitter;
        public float MixFrequency => mixFrequency;
        public float PourTilt => pourTilt;
        public float TiltDuration => tiltDuration;
        public AnimationCurve TiltCurve => tiltCurve;
        public float PourLead => pourLead;
        public Vector3 Land => land;
        public float LandDuration => landDuration;
        public float RecoverDuration => recoverDuration;
        public AnimationCurve RecoverCurve => recoverCurve;
    }
}
