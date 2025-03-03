import { SubPath } from '../../utils/routeUtils';
import Router from '../../utils/Router';
import { RouteType } from '../../utils/types';
import { ErrorForbidden } from '../../utils/errors';
import { AppContext } from '../../utils/types';
import { bodyFields } from '../../utils/requestUtils';
import { User } from '../../db';
import limiterLoginBruteForce from '../../utils/request/limiterLoginBruteForce';

const router = new Router(RouteType.Api);

router.public = true;

router.post('api/sessions', async (_path: SubPath, ctx: AppContext) => {
	await limiterLoginBruteForce(ctx.ip);

	const fields: User = await bodyFields(ctx.req);
	const user = await ctx.joplin.models.user().login(fields.email, fields.password);
	if (!user) throw new ErrorForbidden('Invalid username or password');

	const session = await ctx.joplin.models.session().createUserSession(user.id);
	return { id: session.id, user_id: session.user_id };
});

export default router;
