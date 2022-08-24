
export function IconLink({ link, Img, title }) {
    const imgEle = <Img className={`w-6 ${link ? "fill-fuchsia-500" : "fill-gray-200"}`} width={24} height={24} alt={title}/>;
    if (link) {
        return <a title={title} href={link}>
            {imgEle}
        </a>
    } else {
        return <>{imgEle}</>;
    }
}