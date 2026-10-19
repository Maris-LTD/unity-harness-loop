using UnityEngine;

namespace JuicyAnim
{
    public class AdditiveOffset
    {
        private readonly Transform _view;
        private Vector3 _offset;

        public AdditiveOffset(Transform view)
        {
            _view = view;
        }

        public Vector3 Current => _offset;

        public void Set(Vector3 offset)
        {
            _view.localPosition += offset - _offset;
            _offset = offset;
        }

        public void Clear() => Set(Vector3.zero);
    }
}
