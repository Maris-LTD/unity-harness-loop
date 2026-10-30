var found=new System.Collections.Generic.Dictionary<string,System.Collections.Generic.List<string>>();
foreach (var g in UnityEditor.AssetDatabase.FindAssets("t:Prefab", new[]{__FOLDER__})) {
 var p=UnityEditor.AssetDatabase.GUIDToAssetPath(g);
 var cgo=new UnityEngine.GameObject("__audit",typeof(UnityEngine.RectTransform)); cgo.hideFlags=UnityEngine.HideFlags.HideAndDontSave;
 cgo.AddComponent<UnityEngine.Canvas>().renderMode=UnityEngine.RenderMode.WorldSpace; ((UnityEngine.RectTransform)cgo.transform).sizeDelta=new UnityEngine.Vector2(__CW__,__CH__);
 var root=(UnityEngine.GameObject)UnityEditor.PrefabUtility.InstantiatePrefab(UnityEditor.AssetDatabase.LoadAssetAtPath<UnityEngine.GameObject>(p)); root.transform.SetParent(cgo.transform,false);
 for (int k=0;k<3;k++){ UnityEngine.Canvas.ForceUpdateCanvases(); foreach (var lg in root.GetComponentsInChildren<UnityEngine.UI.LayoutGroup>(true)) UnityEngine.UI.LayoutRebuilder.ForceRebuildLayoutImmediate((UnityEngine.RectTransform)lg.transform); }
 System.Func<UnityEngine.Transform,string> path2=t=>{var s=t.name; while(t.parent!=null){t=t.parent;s=t.name+"/"+s;} return s;};
 System.Func<UnityEngine.Transform,string> path=t=>{var s=t.name; while(t.parent!=null&&t.parent!=cgo.transform){t=t.parent;s=t.name+"/"+s;} return s.Replace("(Clone)","");};
 System.Action<UnityEngine.Component,string> add=(c,msg)=>{var src=UnityEditor.PrefabUtility.GetCorrespondingObjectFromOriginalSource(c); var loc=src!=null?UnityEditor.AssetDatabase.GetAssetPath(src)+" :: "+path2(((UnityEngine.Component)src).transform):p+" :: "+path(c.transform); var key=loc+" | "+msg; if(!found.ContainsKey(key)) found[key]=new System.Collections.Generic.List<string>(); found[key].Add(System.IO.Path.GetFileNameWithoutExtension(p));};
 foreach (var im in root.GetComponentsInChildren<UnityEngine.UI.Image>(true)) {
  if (im.sprite==null||!im.gameObject.activeInHierarchy) continue;
  var r=((UnityEngine.RectTransform)im.transform).rect; var sr=im.sprite.rect; if (r.width<1||r.height<1) continue;
  if (im.type==UnityEngine.UI.Image.Type.Simple && !im.preserveAspect) { float a=(r.width/r.height)/(sr.width/sr.height); if (a<0.92f||a>1.08f) add(im,$"STRETCH [{im.sprite.name}] rect {r.width:0}x{r.height:0} sprite {sr.width:0}x{sr.height:0} aspect x{a:0.00}"); }
  if (im.type==UnityEngine.UI.Image.Type.Sliced || im.type==UnityEngine.UI.Image.Type.Tiled) {
   var b=im.sprite.border; float m=im.pixelsPerUnitMultiplier*(im.sprite.pixelsPerUnit/im.canvas.referencePixelsPerUnit);
   if (b==UnityEngine.Vector4.zero) { if (im.type==UnityEngine.UI.Image.Type.Sliced) add(im,$"SLICED_NO_BORDER [{im.sprite.name}] (renders as stretched Simple)"); }
   else if ((b.x+b.z)/m>r.width+0.5f||(b.y+b.w)/m>r.height+0.5f) add(im,$"SLICE_CRUSH [{im.sprite.name}] rect {r.width:0}x{r.height:0} needs >= {(b.x+b.z)/m:0}x{(b.y+b.w)/m:0} (border {b.x:0},{b.y:0},{b.z:0},{b.w:0} ppuMul {im.pixelsPerUnitMultiplier})");
  }
 }
 foreach (var tx in root.GetComponentsInChildren<TMPro.TMP_Text>(true)) {
  if (!tx.gameObject.activeInHierarchy||string.IsNullOrEmpty(tx.text)) continue;
  tx.ForceMeshUpdate(true,true); var r=tx.rectTransform.rect; var bnd=tx.textBounds;
  bool wide=bnd.size.x>r.width+2; bool tall=bnd.size.y>r.height*1.15f+2; bool atMin=tx.enableAutoSizing && tx.fontSize<=tx.fontSizeMin+0.01f;
  if (wide||tall||atMin) add(tx,$"TEXT '{tx.text.Replace("\n","|")}' rect {r.width:0}x{r.height:0} text {bnd.size.x:0}x{bnd.size.y:0} fs {tx.fontSize:0}{(wide?" WIDE":"")}{(tall?" TALL":"")}{(atMin?" AUTOSIZE_AT_MIN":"")}");
 }
 UnityEngine.Object.DestroyImmediate(cgo);
}
var lines=new System.Collections.Generic.List<string>(); foreach (var kv in found) { var hosts=new System.Collections.Generic.HashSet<string>(kv.Value); var parts=kv.Key.Split(new[]{" | "},2,System.StringSplitOptions.None); lines.Add(parts[1].Split(' ')[0]+" "+parts[0]+" "+parts[1].Substring(parts[1].IndexOf(' ')+1)+(hosts.Count>1?"  [seen in "+hosts.Count+" prefabs]":"")); }
lines.Sort(); System.IO.File.WriteAllLines(__OUT__, lines);
return lines.Count+" unique issues -> "+__OUT__;
