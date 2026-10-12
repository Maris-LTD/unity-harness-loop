var prefab = UnityEditor.AssetDatabase.LoadAssetAtPath<UnityEngine.GameObject>(__PREFAB__);
int CW=__CW__,CH=__CH__; int W=CW,H=CH;
var camGo = new UnityEngine.GameObject("__rcam"); camGo.hideFlags = UnityEngine.HideFlags.HideAndDontSave;
var cam = camGo.AddComponent<UnityEngine.Camera>(); cam.clearFlags = UnityEngine.CameraClearFlags.SolidColor; cam.backgroundColor = new UnityEngine.Color(0.2f,0.2f,0.2f,1); cam.orthographic = true; cam.cullingMask = 1<<31; cam.transform.position = new UnityEngine.Vector3(5000,5000,-10); cam.enabled=false;
var cgo = new UnityEngine.GameObject("__rcanvas"); cgo.hideFlags = UnityEngine.HideFlags.HideAndDontSave; cgo.layer=31;
var canvas = cgo.AddComponent<UnityEngine.Canvas>(); canvas.renderMode = UnityEngine.RenderMode.WorldSpace; canvas.worldCamera = cam; var crt=(UnityEngine.RectTransform)cgo.transform; crt.sizeDelta=new UnityEngine.Vector2(CW,CH); crt.position=new UnityEngine.Vector3(5000,5000,0); cam.orthographicSize=CH/2f; cam.aspect=(float)CW/CH;

var rt = new UnityEngine.RenderTexture(W,H,24); cam.targetTexture = rt;
var inst = (UnityEngine.GameObject)UnityEditor.PrefabUtility.InstantiatePrefab(prefab); inst.hideFlags = UnityEngine.HideFlags.DontSave;
inst.transform.SetParent(cgo.transform,false);
foreach (var t in inst.GetComponentsInChildren<UnityEngine.Transform>(true)) t.gameObject.layer=31;
var irt = inst.GetComponent<UnityEngine.RectTransform>();
if (irt.rect.width < 1) { irt.anchorMin=UnityEngine.Vector2.zero; irt.anchorMax=UnityEngine.Vector2.one; irt.offsetMin=irt.offsetMax=UnityEngine.Vector2.zero; } else { irt.anchorMin=irt.anchorMax=new UnityEngine.Vector2(0.5f,0.5f); irt.anchoredPosition=UnityEngine.Vector2.zero; }
__SETUP__
for (int i=0;i<3;i++){ UnityEngine.Canvas.ForceUpdateCanvases(); foreach (var lg in inst.GetComponentsInChildren<UnityEngine.UI.LayoutGroup>(true)) UnityEngine.UI.LayoutRebuilder.ForceRebuildLayoutImmediate((UnityEngine.RectTransform)lg.transform); }
cam.Render();
UnityEngine.RenderTexture.active = rt; var tex = new UnityEngine.Texture2D(W,H,UnityEngine.TextureFormat.RGB24,false); tex.ReadPixels(new UnityEngine.Rect(0,0,W,H),0,0); tex.Apply(); UnityEngine.RenderTexture.active=null;
var __r = inst.name+" "+irt.rect.size; UnityEngine.Object.DestroyImmediate(inst); UnityEngine.Object.DestroyImmediate(cgo); UnityEngine.Object.DestroyImmediate(camGo); rt.Release();
 System.IO.File.WriteAllBytes(__OUT__, UnityEngine.ImageConversion.EncodeToPNG(tex));
return __r;
