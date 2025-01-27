import FuseScrollbars from '@fuse/core/FuseScrollbars';
import Logo from 'app/fuse-layouts/shared-components/Logo';
import UserMenu from 'app/fuse-layouts/shared-components/UserMenu';
import React from 'react';

function NavbarLayout2() {
	return (
		<div className="flex flex-auto justify-between items-center w-full h-full container p-0 md:px-24">
			<div className="flex flex-shrink-0 items-center px-8 mx-16 md:mx-0">
				<Logo />
			</div>

			<FuseScrollbars className="flex h-full items-center">
				<UserMenu />
			</FuseScrollbars>
		</div>
	);
}

export default React.memo(NavbarLayout2);
