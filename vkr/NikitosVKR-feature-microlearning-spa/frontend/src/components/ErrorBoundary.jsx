import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100vh', background: 'var(--bg)', color: 'var(--t)',
          fontFamily: 'var(--font)', flexDirection: 'column', gap: '16px'
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Что-то пошло не так</h1>
          <p style={{ color: 'var(--t2)' }}>Попробуйте перезагрузить страницу</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Перезагрузить
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
