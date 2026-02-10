import { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Result } from 'antd';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoBack = () => {
    window.history.back();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          padding: '20px'
        }}>
          <Result
            status="error"
            title="เกิดข้อผิดพลาด"
            subTitle="ขออภัย มีบางอย่างผิดพลาด กรุณาลองใหม่อีกครั้ง"
            extra={[
              <Button type="primary" key="reload" onClick={this.handleReload}>
                รีเฟรชหน้า
              </Button>,
              <Button key="back" onClick={this.handleGoBack}>
                ย้อนกลับ
              </Button>,
            ]}
          >
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div style={{ 
                textAlign: 'left', 
                background: '#fff1f0', 
                padding: '16px', 
                borderRadius: '8px',
                marginTop: '16px'
              }}>
                <h4 style={{ color: '#cf1322' }}>Error Details:</h4>
                <pre style={{ 
                  fontSize: '12px', 
                  overflow: 'auto', 
                  maxHeight: '200px',
                  color: '#cf1322'
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}
          </Result>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
