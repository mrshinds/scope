function Error({ statusCode }) {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>
        {statusCode
          ? `${statusCode} - 서버 오류가 발생했습니다`
          : '클라이언트 오류가 발생했습니다'}
      </h1>
      <p>요청하신 페이지를 불러오는 중 오류가 발생했습니다.</p>
      <a href="/" style={{ color: 'blue', textDecoration: 'underline' }}>홈으로 돌아가기</a>
    </div>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error; 