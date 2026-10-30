using TMPro;
using UnityEngine;

namespace JuicyAnim
{
    public readonly struct Face
    {
        private readonly Material _material;
        private readonly string _text;

        private Face(Material material, string text)
        {
            _material = material;
            _text = text;
        }

        public static Face Of(Renderer renderer, TMP_Text label) =>
            new(renderer.sharedMaterial, label != null ? label.text : null);

        public void ApplyTo(Renderer renderer, TMP_Text label)
        {
            renderer.sharedMaterial = _material;
            if (label != null) label.text = _text;
        }
    }
}
