The environment variable replacement functionality is based on a post by Jeff French, available at http://geekindulgence.com/environment-variables-in-angularjs-and-ionic/

There is a gulp task 'replace' which reads the contents of a json config file from this folder and 
creates version of app.config.js in the www folder.

WARNING: nice idea but need to investigate further as regards passing the '--env localdev' argument to
gulp from the Visual studio build.


The json config file should have the following format
{
  "baseURL": "<<base url for server, e.g. http://1.2.3.4>>",
  "basePort": "<<server port to use, e.g 1234>>",

  "apiKey": "<<Google Maps API key>>",

  "DEV_MODE": <<true to enable development mode, false otherwise>>,
  "DEV_USER": "<<username to use for quick login in development mode>>",
  "DEV_PASSWORD": "<<password to use for quick login in development mode>>"

  "storeFactory": <<true to enable debug output, false otherwise>>,
  "localStorage": <<true to enable debug output, false otherwise>>,
  "surveyFactory": <<true to enable debug output, false otherwise>>,
  "canvassFactory": <<true to enable debug output, false otherwise>>,
  "electionFactory": <<true to enable debug output, false otherwise>>,
  "CanvassController": <<true to enable debug output, false otherwise>>,
  "CanvassActionController": <<true to enable debug output, false otherwise>>,
  "SurveyController": <<true to enable debug output, false otherwise>>,
  "navService": <<true to enable debug output, false otherwise>>

}



