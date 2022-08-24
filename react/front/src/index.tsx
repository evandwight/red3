import React from 'react';
import ReactDOM from 'react-dom/client';
import ListingApp from './pages/listing/ListingApp';
import reportWebVitals from './reportWebVitals';
import './index.css';
import PostDetailsApp from 'pages/postdetails/PostDetailsApp';

let rootEle = document.getElementById('listing');
if (rootEle) {
    const root = ReactDOM.createRoot(rootEle as HTMLElement);
    
    root.render(
    <React.StrictMode>
        <ListingApp />
    </React.StrictMode>
    );
}

rootEle = document.getElementById('post-details');
if (rootEle) {
    const root = ReactDOM.createRoot(rootEle as HTMLElement);
    
    root.render(
    <React.StrictMode>
        <PostDetailsApp />
    </React.StrictMode>
    );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
