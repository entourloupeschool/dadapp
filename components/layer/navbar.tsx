import { Navbar } from "flowbite-react";
import { useTheme } from 'next-themes';

interface NavItem {
    label: string;
    subLabel?: string;
    navChildren?: Array<NavItem>;
    href: string;
};


const NAV_ITEMS: Array<NavItem> = [
    {
        label: 'Drawing<line>',
        href: '/p5canvaslinepage',
    },
    {
        label: 'Drawing<pixel>',
        href: '/p5canvaspixelpage',
    },
    {
        label: 'Drawing<curve>',
        href: '/p5canvascurvepage',
    }

];

export default function NavbarCustom():JSX.Element{
    const { systemTheme, theme, setTheme } = useTheme();

    // toggle responsible for changing the theme
    const renderThemeToggle = () => {
      const currentTheme = theme === "system" ? systemTheme : theme;
      if (currentTheme === "dark") {
        return (
          <button
          className='border rounded-sm p-2'
            onClick={() => setTheme("light")}
            type="button"
          > light </button>
        );
      }
      return (
        <button
        className="border rounded-sm p-2"
        onClick={() => setTheme("dark")}
        type="button"
      > dark </button>
      );
    };

    return (
        <Navbar
        fluid={true}
        rounded={true}
        className="bg-white px-2 sm:px-4 py-2.5 dark:bg-gray-900 fixed w-full z-20 top-0 left-0 border-b border-gray-200 dark:border-gray-600"
        >
         
            <Navbar.Brand href="/">
                  <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
                  Hot Sand Playas
                  </span>
              </Navbar.Brand>
              
              {renderThemeToggle()}
              <Navbar.Toggle />
              <Navbar.Collapse >
                  {NAV_ITEMS.map((navItem) => (
                      <Navbar.Link href={navItem.href} key={navItem.label}>
                          <span className="block py-2 pr-4 pl-3 text-gray-700 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent" aria-current="page">{navItem.label}</span>
                      </Navbar.Link>
                  ))}
              </Navbar.Collapse>

        </Navbar>
    );


}
    