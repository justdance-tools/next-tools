module.exports = (title = "Select a file") => {
    return `
    function Open-File([string] $initialDirectory){

        [System.Reflection.Assembly]::LoadWithPartialName("System.windows.forms") | Out-Null
    
        $OpenFileDialog = New-Object System.Windows.Forms.OpenFileDialog
        $OpenFileDialog.initialDirectory = $initialDirectory
        $OpenFileDialog.filter = "All files (*.*)| *.*"
        $OpenFileDialog.title = "${title}"
        $OpenFileDialog.ShowDialog() |  Out-Null
    
        return $OpenFileDialog.filename
    } 
    
    $OpenFile=Open-File $env:USERPROFILE 
    
    if ($OpenFile -ne "") 
    {
        echo $OpenFile
    } 
    else 
    {
        echo no_file
    }
    `
}