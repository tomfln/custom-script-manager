function Invoke-CsmEnv {
    <#
    .SYNOPSIS
    Loads environment variables from the CSM project configuration.
    .DESCRIPTION
    This function invokes 'csm load-env' and applies the environment variables to the current session.
    #>
    
    # Try to find csm executable
    $csmPath = "csm"
    # Check relative to the module location (which is in bin/)
    if (Test-Path "$PSScriptRoot/csm.cmd") {
        $csmPath = "$PSScriptRoot/csm.cmd"
    } elseif (Get-Command csm -ErrorAction SilentlyContinue) {
        $csmPath = "csm"
    }

    # Get environment variables
    $output = & $csmPath load-env --shell powershell
    
    if ($LASTEXITCODE -eq 0) {
        # Evaluate the output to set environment variables
        $output | Invoke-Expression
    } else {
        Write-Error "Failed to load environment variables via csm."
    }
}

Export-ModuleMember -Function Invoke-CsmEnv

