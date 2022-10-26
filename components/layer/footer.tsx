import { Footer } from "flowbite-react";


export default function FooterCustom() {
    const bmcSize = 48;
    return (
    <Footer container={true} className="p-4 bg-white rounded-lg shadow md:flex md:items-center md:justify-between md:p-6 dark:bg-gray-800">
        <Footer.Copyright
            href="#"
            by="Hot Sand Playas"
            year={2022}
            className="text-sm text-gray-500 sm:text-center dark:text-gray-400"
        />
        <Footer.LinkGroup>
            <Footer.Link href="#" className="mr-4 hover:underline md:mr-6 ">
            About
            </Footer.Link>
            <Footer.Link href="#" className="mr-4 hover:underline md:mr-6 ">
            Privacy Policy
            </Footer.Link>
            <Footer.Link href="#" className="mr-4 hover:underline md:mr-6 ">
            Licensing
            </Footer.Link>
            <Footer.Link href="#" className="mr-4 hover:underline md:mr-6 ">
            Contact
            </Footer.Link>
        </Footer.LinkGroup>
    </Footer>
    )
;}