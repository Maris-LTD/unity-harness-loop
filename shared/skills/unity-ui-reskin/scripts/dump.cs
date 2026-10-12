var sb = new System.Text.StringBuilder();
System.Action<UnityEngine.Transform,int> walk = null;
walk = (t,d) => {
  var rt = t as UnityEngine.RectTransform; var img = t.GetComponent<UnityEngine.UI.Image>(); var tmp = t.GetComponent<TMPro.TMP_Text>();
  var comps = string.Join(",", System.Linq.Enumerable.Select(System.Linq.Enumerable.Where(t.GetComponents<UnityEngine.Component>(), c=>c!=null && !(c is UnityEngine.Transform) && !(c is UnityEngine.CanvasRenderer)), c=>c.GetType().Name));
  sb.Append(new string(' ', d*2)).Append(t.name).Append(t.gameObject.activeSelf?"":" [off]");
  if (UnityEditor.PrefabUtility.IsAnyPrefabInstanceRoot(t.gameObject) && d>0) sb.Append(" <prefab:").Append(System.IO.Path.GetFileNameWithoutExtension(UnityEditor.PrefabUtility.GetPrefabAssetPathOfNearestInstanceRoot(t.gameObject))).Append(">");
  if (rt!=null) sb.Append($" size={rt.rect.width:0}x{rt.rect.height:0} pos={rt.anchoredPosition.x:0},{rt.anchoredPosition.y:0} anc={rt.anchorMin.x:0.##},{rt.anchorMin.y:0.##}-{rt.anchorMax.x:0.##},{rt.anchorMax.y:0.##}");
  if (img!=null) sb.Append($" img={(img.sprite?img.sprite.name:"null")} {img.type}{(img.preserveAspect?" keepAspect":"")}");
  if (tmp!=null) sb.Append($" txt='{tmp.text.Replace("\n","|")}' fs={tmp.fontSize:0}{(tmp.enableAutoSizing?" auto":"")}");
  sb.Append(" {").Append(comps).Append("}\n");
  if (d>0 && !__DEEP__ && UnityEditor.PrefabUtility.IsAnyPrefabInstanceRoot(t.gameObject)) { sb.Append(new string(' ', d*2+2)).Append("... ").Append(t.childCount).Append(" children (DEEP=1 to expand)\n"); return; }
  foreach (UnityEngine.Transform c in t) walk(c,d+1);
};
foreach (var p in __PATHS__) { var root = UnityEditor.PrefabUtility.LoadPrefabContents(p); sb.Append("=== ").Append(p).Append('\n'); var start=string.IsNullOrEmpty(__SUB__)?root.transform:root.transform.Find(__SUB__); if (start==null) sb.Append("missing ").Append(__SUB__).Append('\n'); else walk(start,0); UnityEditor.PrefabUtility.UnloadPrefabContents(root); }
return sb.ToString();
