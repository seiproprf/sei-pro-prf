/** O build importa CSS como texto (loader "text" do esbuild) para o Shadow DOM do balão. */
declare module "*.css" {
  const texto: string;
  export default texto;
}
