# canvasstrac-mobile
Mobile client application for CanvassTrac suite

## Development Environment
The development environment:
* Visual Studio Community 2017 with Visual Studio Tools for Apache Cordova
* Node.js v6.11.1
* npm v2.15.9
* bower v1.7.9
* gulp v3.9.1
* MongoDB v3.2.4

### Environment setup
See [README.md](canvasstrac-mobile/README.md) for details.

**NOTE:** In addition to the basic setup, it is necessary to add a localdev.json file. See [canvasstrac-mobile/config/readme.txt](canvasstrac-mobile/config/readme.txt) for details.

### Gotcha's
* There is an incompatability between Android SDK Tools 26 & Cordova 6.3.1. Due to SDK changes you get a build error:
 
  1>MSBUILD : cordova-build error : Error: Could not find gradle wrapper within Android SDK. Might need to update your Android SDK.

  1>MSBUILD : cordova-build error : Looked here: *[your path]*\android-sdk\tools\templates\gradle\wrapper

  Workaround until things get fixed is to copy the <code>C:\Program Files\Android\Android Studio\plugins\android\lib\templates</code> folder & its contents to <code>*[your path]*\android-sdk\tools</code>


### Make a build
The application configuration may be set as follows:
* prior to building in Visual Studio run the following command from the <code>canvasstrac-mobile</code> folder in the project
<code>gulp replace --env 'config file name'</code>
* alternatively create a json file <code>.env</code> in the <code>canvasstrac-mobile</code> folder in the project with the contents

  { "env": "config file name" }

See [https://taco.visualstudio.com/en-us/docs/tutorial-package-publish-readme/](https://taco.visualstudio.com/en-us/docs/tutorial-package-publish-readme/) for information regarding making a release for the Play Store.

### Developer notes
Some miscellaneous developer notes:
* Adding font-awsome

  Combination of the following:
  
  http://robferguson.org/2015/01/06/add-font-awesome-to-your-ionic-project/ to add the icons

  https://www.thepolyglotdeveloper.com/2014/10/use-font-awesome-glyph-icons-ionicframework/ to get rid of the missing font errors
  
