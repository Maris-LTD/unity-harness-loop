using UnityEngine;

namespace JuicyAnim
{
    public static class CurvePresets
    {
        public static AnimationCurve Linear() => AnimationCurve.Linear(0f, 0f, 1f, 1f);

        public static AnimationCurve OutQuad() => new(new Keyframe(0f, 0f, 2f, 2f), new Keyframe(1f, 1f, 0f, 0f));

        public static AnimationCurve InQuad() => new(new Keyframe(0f, 0f, 0f, 0f), new Keyframe(1f, 1f, 2f, 2f));

        public static AnimationCurve OutBack() => new(
            new Keyframe(0f, 0f, 4f, 4f),
            new Keyframe(0.65f, 1.08f, 0f, 0f),
            new Keyframe(1f, 1f, 0f, 0f));

        public static AnimationCurve Arc() => new(
            new Keyframe(0f, 0f, 4f, 4f),
            new Keyframe(0.5f, 1f, 0f, 0f),
            new Keyframe(1f, 0f, -4f, -4f));

        public static AnimationCurve RiseAndFall() => new(
            new Keyframe(0f, 0f, 8f, 8f),
            new Keyframe(0.3f, 1f, 0f, 0f),
            new Keyframe(1f, 0f, 0f, 0f));

        public static AnimationCurve Wobble() => new(
            new Keyframe(0f, 0f, 9f, 9f),
            new Keyframe(0.18f, 1.22f, 0f, 0f),
            new Keyframe(0.38f, 0.9f, 0f, 0f),
            new Keyframe(0.58f, 1.05f, 0f, 0f),
            new Keyframe(0.78f, 0.98f, 0f, 0f),
            new Keyframe(1f, 1f, 0f, 0f));
    }
}
