// src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CalendarGrid from './components/CalendarGrid';
import SubscriptionList from './components/SubscriptionList';
import SubscriptionModal from './components/SubscriptionModal';
import Totals from './components/Totals';
import ConfigurationModal from './components/ConfigurationModal.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import './App.css';

function App() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [ntfyTopic, setNtfyTopic] = useState('');
  const [ntfyDomain, setNtfyDomain] = useState('https://ntfy.sh');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const username = process.env.REACT_APP_USERNAME;
  const password = process.env.REACT_APP_PASSWORD;

  const handleLogin = () => {
    if (usernameInput === username && passwordInput === password) {
      setIsAuthenticated(true);
    } else {
      alert('Incorrect username or password');
    }
  };


  useEffect(() => {
    fetchSubscriptions();
    fetchConfiguration();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await axios.get('/api/subscriptions');
      setSubscriptions(response.data.map(sub => ({ ...sub, included: true })));
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const fetchConfiguration = async () => {
    try {
      const [currencyResponse, ntfyResponse] = await Promise.all([
        axios.get('/api/user-configuration'),
        axios.get('/api/ntfy-settings')
      ]);
      setCurrency(currencyResponse.data.currency);
      setNtfyTopic(ntfyResponse.data.topic);
      setNtfyDomain(ntfyResponse.data.domain);
    } catch (error) {
      console.error('Error fetching configuration:', error);
    }
  };

  const addOrUpdateSubscription = async (subscription) => {
    try {
      if (subscription.id) {
        await axios.put(`/api/subscriptions/${subscription.id}`, subscription);
      } else {
        await axios.post('/api/subscriptions', subscription);
      }
      fetchSubscriptions();
    } catch (error) {
      console.error('Error adding/updating subscription:', error);
    }
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setSelectedSubscription(null);
    setIsModalOpen(true);
  };

  const handleEdit = (subscription) => {
    setSelectedSubscription(subscription);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      try {
        await axios.delete(`/api/subscriptions/${id}`);
        fetchSubscriptions();
      } catch (error) {
        console.error('Error deleting subscription:', error);
      }
    }
  };

  const handleToggleInclude = (id) => {
    setSubscriptions(subscriptions.map(sub =>
      sub.id === id ? { ...sub, included: !sub.included } : sub
    ));
  };

  const handleConfigurationSave = async (newConfig) => {
    try {
      await Promise.all([
        axios.post('/api/user-configuration', { currency: newConfig.currency }),
        axios.post('/api/ntfy-settings', { topic: newConfig.ntfyTopic, domain: newConfig.ntfyDomain })
      ]);
      setCurrency(newConfig.currency);
      setNtfyTopic(newConfig.ntfyTopic);
      setNtfyDomain(newConfig.ntfyDomain);
      setIsConfigModalOpen(false);
      // Fetch subscriptions again to update with new currency
      fetchSubscriptions();
    } catch (error) {
      console.error('Error saving configuration:', error);
    }
  };

  
  if (!isAuthenticated) {
    return (
      <div className="app">
        <div className="app-header">
          <div className="app-login">
            <input
              type="text"
              placeholder="Username"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
            <button onClick={handleLogin}>Login</button>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="app">
        <div className="app-header">
          <h1>Subscription Manager</h1>
          <button 
            className="config-button" 
            onClick={() => setIsConfigModalOpen(true)}
          >
            <FontAwesomeIcon icon={faCog} /> Settings
          </button>
        </div>
        <CalendarGrid
          subscriptions={subscriptions}
          onDateClick={handleDateClick}
          currentDate={new Date()}
        />
        {subscriptions.length > 0 && (
          <SubscriptionList
            subscriptions={subscriptions}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleInclude={handleToggleInclude}
            currency={currency}
          />
        )}
        <Totals subscriptions={subscriptions.filter(sub => sub.included)} currency={currency} />
        {isModalOpen && (
          <SubscriptionModal
            onClose={() => {
              setIsModalOpen(false);
              setSelectedSubscription(null);
              setSelectedDate(null);
            }}
            onSave={addOrUpdateSubscription}
            selectedSubscription={selectedSubscription}
            selectedDate={selectedDate}
            defaultCurrency={currency}
          />
        )}
        <ConfigurationModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          currency={currency}
          ntfyTopic={ntfyTopic}
          ntfyDomain={ntfyDomain}
          onSave={handleConfigurationSave}
        />
      </div>
    );
  }
}

export default App;
