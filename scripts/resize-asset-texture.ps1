param([Parameter(Mandatory=$true)][string]$InputPath,[Parameter(Mandatory=$true)][string]$OutputPath,[int]$MaxSize=1024)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$source=[System.Drawing.Image]::FromFile($InputPath)
try {
  $scale=[Math]::Min(1.0,$MaxSize/[Math]::Max($source.Width,$source.Height))
  $bitmap=New-Object System.Drawing.Bitmap([int]($source.Width*$scale),[int]($source.Height*$scale))
  try {
    $graphics=[System.Drawing.Graphics]::FromImage($bitmap)
    try {
      $graphics.CompositingMode=[System.Drawing.Drawing2D.CompositingMode]::SourceCopy
      $graphics.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.DrawImage($source,0,0,$bitmap.Width,$bitmap.Height)
    } finally { $graphics.Dispose() }
    $bitmap.Save($OutputPath,[System.Drawing.Imaging.ImageFormat]::Png)
  } finally { $bitmap.Dispose() }
} finally { $source.Dispose() }
