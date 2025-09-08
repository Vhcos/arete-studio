export async function getServerSideProps() {
  return {
    redirect: { destination: "/recursos/centro-de-ayuda", permanent: true },
  };
}
export default function RecursosIndex() { return null; }
