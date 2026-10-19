string parentDir = "Assets/Art/3D";
string name = "SandBucket";
string sourceMaterial = "Assets/Art/Materials/Box.mat";
string prefabPath = "Assets/Prefabs/SandBucket.prefab";
Color bodyColor = new Color(0.9f, 0.16f, 0.14f);
Color handleColor = new Color(1f, 0.82f, 0.18f);
string dir = parentDir + "/" + name;
if (!AssetDatabase.IsValidFolder(dir)) AssetDatabase.CreateFolder(parentDir, name);
var verts = new System.Collections.Generic.List<Vector3>();
var body = new System.Collections.Generic.List<int>();
var handle = new System.Collections.Generic.List<int>();
int seg = 40;
Vector2[] profile = {
  new Vector2(0f, 0f), new Vector2(0.36f, 0f),
  new Vector2(0.38f, 0.02f), new Vector2(0.5f, 0.72f),
  new Vector2(0.54f, 0.74f), new Vector2(0.55f, 0.78f), new Vector2(0.53f, 0.8f),
  new Vector2(0.47f, 0.8f), new Vector2(0.45f, 0.78f),
  new Vector2(0.34f, 0.06f), new Vector2(0f, 0.06f) };
for (int p = 0; p < profile.Length - 1; p++) {
  Vector2 a = profile[p], b = profile[p + 1];
  int start = verts.Count;
  for (int s = 0; s <= seg; s++) {
    float ang = s * Mathf.PI * 2f / seg; float c = Mathf.Cos(ang), sn = Mathf.Sin(ang);
    verts.Add(new Vector3(a.x * c, a.y, a.x * sn));
    verts.Add(new Vector3(b.x * c, b.y, b.x * sn));
  }
  for (int s = 0; s < seg; s++) {
    int i0 = start + s * 2, i1 = i0 + 1, i2 = i0 + 2, i3 = i0 + 3;
    body.Add(i0); body.Add(i1); body.Add(i2);
    body.Add(i2); body.Add(i1); body.Add(i3);
  }
}
int arcSeg = 24, tubeSeg = 10; float R = 0.53f, tube = 0.025f, baseY = 0.62f;
int hStart = verts.Count;
for (int i = 0; i <= arcSeg; i++) {
  float th = Mathf.PI * i / arcSeg;
  Vector3 center = new Vector3(R * Mathf.Cos(th), baseY + R * 0.95f * Mathf.Sin(th), 0f);
  Vector3 tangent = new Vector3(-Mathf.Sin(th), 0.95f * Mathf.Cos(th), 0f).normalized;
  Vector3 n1 = Vector3.Cross(tangent, Vector3.forward).normalized, n2 = Vector3.forward;
  for (int j = 0; j <= tubeSeg; j++) {
    float ph = j * Mathf.PI * 2f / tubeSeg;
    verts.Add(center + (n1 * Mathf.Cos(ph) + n2 * Mathf.Sin(ph)) * tube);
  }
}
Vector3 c0 = new Vector3(R, baseY, 0f);
Vector3 tn = Vector3.Cross(verts[hStart + tubeSeg + 1] - verts[hStart], verts[hStart + 1] - verts[hStart]);
bool keep = Vector3.Dot(tn, verts[hStart] - c0) > 0f;
for (int i = 0; i < arcSeg; i++) for (int j = 0; j < tubeSeg; j++) {
  int a = hStart + i * (tubeSeg + 1) + j, b = a + tubeSeg + 1;
  if (keep) { handle.Add(a); handle.Add(b); handle.Add(a + 1); handle.Add(a + 1); handle.Add(b); handle.Add(b + 1); }
  else { handle.Add(a); handle.Add(a + 1); handle.Add(b); handle.Add(a + 1); handle.Add(b + 1); handle.Add(b); }
}
var mesh = new Mesh { name = name };
mesh.SetVertices(verts); mesh.subMeshCount = 2;
mesh.SetTriangles(body, 0); mesh.SetTriangles(handle, 1);
mesh.RecalculateNormals(); mesh.RecalculateBounds();
string meshPath = dir + "/" + name + ".asset";
AssetDatabase.DeleteAsset(meshPath);
AssetDatabase.CreateAsset(mesh, meshPath);
var src = AssetDatabase.LoadAssetAtPath<Material>(sourceMaterial);
Material Make(string n, Color col) { var m = new Material(src) { name = n }; m.SetColor("_BaseColor", col); if (m.HasProperty("_Color")) m.SetColor("_Color", col); string mp = dir + "/" + n + ".mat"; AssetDatabase.DeleteAsset(mp); AssetDatabase.CreateAsset(m, mp); return m; }
var red = Make(name + "Body", bodyColor);
var yellow = Make(name + "Handle", handleColor);
var go = new GameObject(name);
go.AddComponent<MeshFilter>().sharedMesh = mesh;
var mr = go.AddComponent<MeshRenderer>(); mr.sharedMaterials = new[] { red, yellow };
mr.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
PrefabUtility.SaveAsPrefabAsset(go, prefabPath);
UnityEngine.Object.DestroyImmediate(go);
AssetDatabase.SaveAssets();
return "verts=" + verts.Count + " body=" + body.Count / 3 + " handle=" + handle.Count / 3;
