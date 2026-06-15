Add-Type -AssemblyName System.Drawing

function Resize-Image($sourcePath, $destinationPath, $width, $height) {
    if (Test-Path $sourcePath) {
        $img = [System.Drawing.Image]::FromFile($sourcePath)
        $bmp = New-Object System.Drawing.Bitmap $width, $height
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        
        # High quality resizing
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.DrawImage($img, 0, 0, $width, $height)
        
        $g.Dispose()
        
        # Save to temporary path and then overwrite
        $tempPath = "$destinationPath.tmp"
        $bmp.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $bmp.Dispose()
        $img.Dispose()
        
        Move-Item -Path $tempPath -Destination $destinationPath -Force
        Write-Host "Resized $destinationPath to ${width}x${height}"
    } else {
        Write-Host "File $sourcePath not found"
    }
}

$iconsDir = "d:\mongodb-lens-extension\public\icons"

Resize-Image "$iconsDir\icon16.png" "$iconsDir\icon16.png" 16 16
Resize-Image "$iconsDir\icon48.png" "$iconsDir\icon48.png" 48 48
Resize-Image "$iconsDir\icon128.png" "$iconsDir\icon128.png" 128 128
