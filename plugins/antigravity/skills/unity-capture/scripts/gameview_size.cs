int W=__W__, H=__H__;
var asm=typeof(UnityEditor.Editor).Assembly;
var gvType=asm.GetType("UnityEditor.GameView");
var sizesType=asm.GetType("UnityEditor.GameViewSizes");
var single=typeof(UnityEditor.ScriptableSingleton<>).MakeGenericType(sizesType);
var inst=single.GetProperty("instance").GetValue(null);
var grpType=UnityEditor.EditorUserBuildSettings.activeBuildTarget==UnityEditor.BuildTarget.iOS?"iOS":(UnityEditor.EditorUserBuildSettings.activeBuildTarget==UnityEditor.BuildTarget.Android?"Android":"Standalone");
var group=sizesType.GetMethod("GetGroup").Invoke(inst,new object[]{System.Enum.Parse(asm.GetType("UnityEditor.GameViewSizeGroupType"),grpType)});
var gType=group.GetType();
int total=(int)gType.GetMethod("GetTotalCount").Invoke(group,null);
int idx=-1;
for(int i=0;i<total;i++){var s=gType.GetMethod("GetGameViewSize").Invoke(group,new object[]{i}); var st=s.GetType(); if((int)st.GetProperty("width").GetValue(s)==W&&(int)st.GetProperty("height").GetValue(s)==H&&st.GetProperty("sizeType").GetValue(s).ToString()=="FixedResolution"){idx=i;break;}}
if(idx<0){var sizeT=asm.GetType("UnityEditor.GameViewSize"); var kind=System.Enum.Parse(asm.GetType("UnityEditor.GameViewSizeType"),"FixedResolution"); var ns=System.Activator.CreateInstance(sizeT,new object[]{kind,W,H,W+"x"+H}); gType.GetMethod("AddCustomSize").Invoke(group,new object[]{ns}); idx=total;}
var gv=UnityEditor.EditorWindow.GetWindow(gvType);
gvType.GetMethod("SizeSelectionCallback",System.Reflection.BindingFlags.Instance|System.Reflection.BindingFlags.Public|System.Reflection.BindingFlags.NonPublic).Invoke(gv,new object[]{idx,null});
gv.Repaint();
return grpType+" size index "+idx+" -> "+W+"x"+H;
