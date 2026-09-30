import { ReactNode, Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { HelmetProvider } from 'react-helmet-async';
import { ToastContainer } from 'react-toastify';
import Error500 from '@/errors/500Error';
import { Provider } from 'react-redux';
import { store } from '@/store';
;

type AppProviderProps = {
    children: ReactNode;
};

export const AppProvider = (props: AppProviderProps) => {
    const { children } = props;

    return (
        <Suspense fallback={ <div>loading </div>}>
            <ErrorBoundary FallbackComponent={Error500}>
                <HelmetProvider>
                    <Provider store={store}>
                       
                                <BrowserRouter>{children}</BrowserRouter>
                         
                    </Provider>

                    <ToastContainer position="top-right" theme="colored" />
                </HelmetProvider>
            </ErrorBoundary>
        </Suspense>
    );
};