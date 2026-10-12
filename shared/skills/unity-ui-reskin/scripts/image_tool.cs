System.Func<string,UnityEngine.Texture2D> load = f => { var t=new UnityEngine.Texture2D(2,2); UnityEngine.ImageConversion.LoadImage(t, System.IO.File.ReadAllBytes(f)); return t; };
System.Func<UnityEngine.Texture2D,int,int,UnityEngine.Texture2D> scale = (t,w,h) => { var rt=UnityEngine.RenderTexture.GetTemporary(w,h); UnityEngine.Graphics.Blit(t,rt); var prev=UnityEngine.RenderTexture.active; UnityEngine.RenderTexture.active=rt; var o=new UnityEngine.Texture2D(w,h,UnityEngine.TextureFormat.RGB24,false); o.ReadPixels(new UnityEngine.Rect(0,0,w,h),0,0); o.Apply(); UnityEngine.RenderTexture.active=prev; UnityEngine.RenderTexture.ReleaseTemporary(rt); return o; };
var mode=__MODE__; var outPath=__OUT__; var a=__ARGS__; var files=__FILES__;
UnityEngine.Texture2D result;
if (mode=="crop") {
 var src=load(files[0]); int x=a[0], y=a[1], w=System.Math.Min(a[2],src.width-a[0]), h=System.Math.Min(a[3],src.height-a[1]);
 var c=new UnityEngine.Texture2D(w,h,UnityEngine.TextureFormat.RGB24,false); c.SetPixels(src.GetPixels(x, src.height-y-h, w, h)); c.Apply();
 int mx=a.Length>4?a[4]:0; result = (mx>0 && System.Math.Max(w,h)>mx) ? scale(c, w*mx/System.Math.Max(w,h), h*mx/System.Math.Max(w,h)) : c;
} else {
 int H=a[0], gap=8; var parts=new System.Collections.Generic.List<UnityEngine.Texture2D>();
 foreach (var f in files) { var t=load(f); parts.Add(scale(t, System.Math.Max(1,t.width*H/t.height), H)); }
 int W=-gap; foreach (var p in parts) W+=p.width+gap;
 result=new UnityEngine.Texture2D(W,H,UnityEngine.TextureFormat.RGB24,false); var fill=new UnityEngine.Color[W*H]; for (int i=0;i<fill.Length;i++) fill[i]=UnityEngine.Color.magenta; result.SetPixels(fill);
 int px=0; foreach (var p in parts) { result.SetPixels(px,0,p.width,H,p.GetPixels()); px+=p.width+gap; } result.Apply();
}
System.IO.File.WriteAllBytes(outPath, UnityEngine.ImageConversion.EncodeToPNG(result));
return outPath+" "+result.width+"x"+result.height;
