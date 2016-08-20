import React from 'react';
import ReactDom from 'react-dom';
import injectTapEventPlugin from 'react-tap-event-plugin';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import AppWrapper from './js/AppWrapper.jsx';

injectTapEventPlugin();
require('./style/main.css');

ReactDom.render((
    <MuiThemeProvider>
        <AppWrapper />
    </MuiThemeProvider>
), document.getElementById('mainContainer'));