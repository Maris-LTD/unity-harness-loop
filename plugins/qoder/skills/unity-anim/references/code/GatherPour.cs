using System;
using System.Collections.Generic;
using DG.Tweening;
using UnityEngine;

namespace JuicyAnim
{
    public static class GatherPour
    {
        public struct Hooks
        {
            public Action<int> SwapFace;
            public Action<int> NearlyLanded;
            public Action<int> Killed;
            public Action Completed;
            public Func<GameObject, Transform, GameObject> Rent;
            public Action<GameObject> Return;
        }

        public static void Play(IReadOnlyList<Transform> items, IReadOnlyList<float> delays, GatherPourSettings s, Hooks hooks)
        {
            int remaining = items.Count;
            if (remaining == 0)
            {
                hooks.Completed?.Invoke();
                return;
            }

            float earliest = float.MaxValue, latest = 0f;
            Vector3 center = Vector3.zero;
            for (int i = 0; i < items.Count; i++)
            {
                earliest = Mathf.Min(earliest, delays[i]);
                latest = Mathf.Max(latest, delays[i]);
                center += items[i].position;
            }
            center /= items.Count;

            float mixStart = latest + s.SquashDuration + s.FlyInDuration;
            float pourAt = mixStart + s.MixDuration;
            float appearAt = Mathf.Max(0f, earliest + s.SquashDuration - s.PopDuration * 0.5f);
            float leaveAt = pourAt + s.PourLead + latest + s.FlyOutDuration * 0.5f;

            Transform parent = items[0].parent;
            Transform container = Container(parent, center + Vector3.up * s.ContainerHeight, s, hooks, appearAt, mixStart, pourAt, leaveAt);

            for (int i = 0; i < items.Count; i++)
            {
                int index = i;
                Transform view = items[i];
                Vector2 around = UnityEngine.Random.insideUnitCircle * s.InsideRadius;
                var spot = new Vector3(around.x, UnityEngine.Random.Range(s.InsideHeight.x, s.InsideHeight.y), around.y);
                var motion = new GatherMotion(view, container, spot, s, mixStart, pourAt);

                bool landed = false;
                Sequence show = motion.Build(delays[i], () => hooks.SwapFace?.Invoke(index));
                show.InsertCallback(Mathf.Max(0f, show.Duration(false) - s.RecoverDuration), () =>
                    {
                        landed = true;
                        hooks.NearlyLanded?.Invoke(index);
                    })
                    .SetTarget(view)
                    .SetLink(view.gameObject)
                    .OnKill(() =>
                    {
                        motion.Rest();
                        hooks.Killed?.Invoke(index);
                        if (!landed) hooks.NearlyLanded?.Invoke(index);
                        if (--remaining == 0) hooks.Completed?.Invoke();
                    });
            }
        }

        private static Transform Container(Transform parent, Vector3 worldBase, GatherPourSettings s, Hooks hooks,
            float appearAt, float mixStart, float pourAt, float leaveAt)
        {
            GameObject go = hooks.Rent != null ? hooks.Rent(s.Container, parent) : UnityEngine.Object.Instantiate(s.Container, parent);
            Transform view = go.transform;
            view.position = worldBase;
            view.localRotation = Quaternion.identity;
            view.localScale = Vector3.zero;

            Vector3 full = Vector3.one * s.ContainerScale;

            DOTween.Sequence()
                .Insert(appearAt, DOVirtual.Float(0f, 1f, s.PopDuration, t => view.localScale = full * s.PopCurve.Evaluate(t)).SetEase(Ease.Linear))
                .Insert(mixStart, view.DOShakeRotation(s.MixDuration, new Vector3(0f, 0f, s.Shake), 8, 0f, false))
                .Insert(mixStart, view.DOPunchScale(full * 0.12f, s.MixDuration, 6, 0.5f))
                .Insert(pourAt, DOVirtual.Float(0f, 1f, s.TiltDuration,
                    t => view.localRotation = Quaternion.Euler(s.PourTilt * s.TiltCurve.Evaluate(t), 0f, 0f)).SetEase(Ease.Linear))
                .Insert(leaveAt, view.DOLocalRotate(Vector3.zero, s.HideDuration).SetEase(Ease.OutQuad))
                .Insert(leaveAt, view.DOScale(Vector3.zero, s.HideDuration).SetEase(Ease.InBack))
                .SetTarget(view)
                .SetLink(go)
                .OnKill(() =>
                {
                    view.localRotation = Quaternion.identity;
                    view.localScale = Vector3.one;
                    if (hooks.Return != null) hooks.Return(go);
                    else UnityEngine.Object.Destroy(go);
                });

            return view;
        }
    }

    public class GatherMotion
    {
        private readonly Transform _view;
        private readonly Transform _container;
        private readonly Vector3 _spot;
        private readonly GatherPourSettings _s;
        private readonly float _mixStart;
        private readonly float _pourAt;
        private readonly Vector3 _home;
        private readonly Quaternion _rest;
        private readonly AdditiveOffset _offset;
        private readonly float _seed;

        private bool _leaving;
        private Vector3 _leaveFrom;
        private Quaternion _leaveTurn;

        public GatherMotion(Transform view, Transform container, Vector3 spot, GatherPourSettings s, float mixStart, float pourAt)
        {
            _view = view;
            _container = container;
            _spot = spot;
            _s = s;
            _mixStart = mixStart;
            _pourAt = pourAt;
            _home = view.localPosition;
            _rest = view.localRotation;
            _offset = new AdditiveOffset(view);
            _seed = UnityEngine.Random.value * Mathf.PI * 2f;
        }

        public Sequence Build(float delay, TweenCallback swapFace)
        {
            float arrive = delay + _s.SquashDuration + _s.FlyInDuration;
            float hold = Mathf.Max(0f, _mixStart - arrive);
            float ride = Mathf.Max(0f, _pourAt + _s.PourLead + delay - (_mixStart + _s.MixDuration));

            return DOTween.Sequence()
                .AppendInterval(delay)
                .Append(_view.DOScale(_s.Squash, _s.SquashDuration))
                .Append(DOVirtual.Float(0f, 1f, _s.FlyInDuration, FlyIn).SetEase(Ease.Linear))
                .Append(DOVirtual.Float(0f, 1f, hold, _ => _offset.Set(Point(_spot))).SetEase(Ease.Linear))
                .Append(DOVirtual.Float(0f, 1f, _s.MixDuration, Mix).SetEase(Ease.Linear))
                .Append(DOVirtual.Float(0f, 1f, ride, _ => _offset.Set(Point(_spot))).SetEase(Ease.Linear))
                .Append(DOVirtual.Float(0f, 1f, _s.FlyOutDuration, FlyOut).SetEase(Ease.Linear))
                .Append(_view.DOScale(_s.Land, _s.LandDuration))
                .Append(_view.DOScale(Vector3.one, _s.RecoverDuration).SetEase(_s.RecoverCurve))
                .InsertCallback(_mixStart + _s.MixDuration * 0.5f, swapFace);
        }

        public void Rest()
        {
            _offset.Clear();
            _view.localScale = Vector3.one;
            _view.localRotation = _rest;
        }

        private Vector3 Point(Vector3 spot)
        {
            Vector3 world = _container.TransformPoint(spot);
            Transform parent = _view.parent;
            return (parent != null ? parent.InverseTransformPoint(world) : world) - _home;
        }

        private void FlyIn(float t)
        {
            float along = _s.MoveCurve.Evaluate(t);
            _offset.Set(Vector3.LerpUnclamped(Vector3.zero, Point(_spot), along) + Vector3.up * (_s.ArcCurve.Evaluate(t) * _s.FlyInArcHeight));
            _view.localScale = Vector3.LerpUnclamped(_s.Squash, Vector3.one * _s.InsideScale, Mathf.SmoothStep(0f, 1f, t));
        }

        private void Mix(float t)
        {
            float phase = t * _s.MixDuration * _s.MixFrequency * Mathf.PI * 2f + _seed;
            Vector3 wander = new Vector3(Mathf.Sin(phase), 0f, Mathf.Cos(phase * 1.3f)) * (_s.MixJitter * Mathf.Sin(t * Mathf.PI));
            _offset.Set(Point(_spot + wander));
            _view.localRotation = _rest * Quaternion.Euler(0f, _s.MixSpin * t, 0f);
        }

        private void FlyOut(float t)
        {
            if (!_leaving)
            {
                _leaving = true;
                _leaveFrom = Point(_spot);
                _leaveTurn = _view.localRotation;
            }

            float along = _s.MoveCurve.Evaluate(t);
            _offset.Set(Vector3.LerpUnclamped(_leaveFrom, Vector3.zero, along) + Vector3.up * (_s.ArcCurve.Evaluate(t) * _s.FlyOutArcHeight));
            _view.localRotation = Quaternion.SlerpUnclamped(_leaveTurn, _rest, along);
            _view.localScale = Vector3.LerpUnclamped(Vector3.one * _s.InsideScale, Vector3.one, Mathf.SmoothStep(0f, 1f, t));
        }
    }
}
