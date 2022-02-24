$source = 'http://www.mieliestronk.com/corncob_lowercase.txt'
$destination = 'wordlist.txt'
Invoke-WebRequest -Uri $source -OutFile $destination
