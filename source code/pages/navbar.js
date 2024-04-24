import { Menu } from 'semantic-ui-react';
import Link from 'next/link';

const NavBar = () => {
    return (
        <Menu inverted>
            <Link href='/' passHref>
                <Menu.Item name='home'>
                    Home
                </Menu.Item>
            </Link>
            <Link href='/identity' passHref>
                <Menu.Item name='identity'>
                    Identity Management
                </Menu.Item>
            </Link>
            <Link href='/issuance' passHref>
                <Menu.Item name='issuance'>
                    Credential Issuance
                </Menu.Item>
            </Link>
            <Link href='/verification' passHref>
                <Menu.Item name='verification'>
                    Credential Verification
                </Menu.Item>
            </Link>
            <Link href='/community' passHref>
                <Menu.Item name='community'>
                    Community Voting
                </Menu.Item>
            </Link>
        </Menu>
    );
};

export default NavBar;