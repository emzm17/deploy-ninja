const isValidGitHubUrl = (url) => { 
    try {
         const parsedUrl = new URL(url); const hostname = parsedUrl.hostname.toLowerCase(); 
         return ( (hostname === 'github.com' || hostname === 'www.github.com') && /^\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+/.test(parsedUrl.pathname) );

 } catch (error) { 
    return false; }
 };


 module.exports=isValidGitHubUrl;