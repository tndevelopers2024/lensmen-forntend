import { Typography, Space } from 'antd'

const { Title, Text } = Typography

const PageHeader = ({ eyebrow, title, subtitle, actions }) => (
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16,
    flexWrap: 'wrap',
  }}>
    <div>
      {eyebrow && (
        <Text style={{
          color: '#6b7280',
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          display: 'block',
          marginBottom: 4,
        }}>
          {eyebrow}
        </Text>
      )}
      <Title level={4} style={{ margin: 0, color: '#111827', lineHeight: 1.25, fontWeight: 700 }}>
        {title}
      </Title>
      {subtitle && (
        <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 3, display: 'block' }}>
          {subtitle}
        </Text>
      )}
    </div>
    {actions && <Space wrap>{actions}</Space>}
  </div>
)

export default PageHeader
