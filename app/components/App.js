"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const styles_1 = require("@mui/material/styles");
const CssBaseline_1 = require("@mui/material/CssBaseline");
const config_1 = require("../routes/config");
const RouteWithSubRoutes_1 = require("../routes/RouteWithSubRoutes");
const MessageContext_1 = require("../context/MessageContext");
const darkTheme = (0, styles_1.createTheme)({
    palette: {
        mode: 'dark',
    },
});
const App = () => {
    const [messagesFromExtension, setMessagesFromExtension] = (0, react_1.useState)([]);
    const handleMessagesFromExtension = (0, react_1.useCallback)((event) => {
        if (event.data.type === 'COMMON') {
            const message = event.data;
            setMessagesFromExtension([...messagesFromExtension, message.payload]);
        }
    }, [messagesFromExtension]);
    (0, react_1.useEffect)(() => {
        window.addEventListener('message', (event) => {
            handleMessagesFromExtension(event);
        });
        return () => {
            window.removeEventListener('message', handleMessagesFromExtension);
        };
    }, [handleMessagesFromExtension]);
    const handleReloadWebview = () => {
        // @ts-ignore
        vscode.postMessage({
            type: 'RELOAD',
        });
    };
    return (<react_router_dom_1.MemoryRouter initialEntries={['/', '/addTask', '/updateTask']}>
      <styles_1.ThemeProvider theme={darkTheme}>
        <CssBaseline_1.default enableColorScheme/>
        <main className='py-4'>
          {/* <button onClick={handleReloadWebview}>Reload Webview</button> */}
          <MessageContext_1.MessagesContext.Provider value={messagesFromExtension}>
            <react_router_dom_1.Switch>
              {config_1.routes.map((route, i) => (<RouteWithSubRoutes_1.RouteWithSubRoutes key={i} {...route}/>))}
            </react_router_dom_1.Switch>
          </MessageContext_1.MessagesContext.Provider>
        </main>
      </styles_1.ThemeProvider>
    </react_router_dom_1.MemoryRouter>);
};
exports.App = App;
//# sourceMappingURL=App.js.map