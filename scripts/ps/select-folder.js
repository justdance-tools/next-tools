module.exports = (desc = "Select a folder") => {
    return `
    Function Select-FolderDialog
    {
        param([string]$Description="${desc}",[string]$RootFolder="Desktop")
    
     [System.Reflection.Assembly]::LoadWithPartialName("System.windows.forms") |
         Out-Null     
    
       $objForm = New-Object System.Windows.Forms.FolderBrowserDialog
            $objForm.Rootfolder = $RootFolder
            $objForm.Description = $Description
            $Show = $objForm.ShowDialog()
            If ($Show -eq "OK")
            {
                Return $objForm.SelectedPath
            }
            Else
            {
                Write-Error "Operation cancelled by user."
            }
        }
    
    $folder = Select-FolderDialog # the variable contains user folder selection
    write-host $folder
    `
}