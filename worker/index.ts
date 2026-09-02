type Env = {
  ASSETS: { fetch(request: Request): Promise<Response> };
};

const worker = {
  fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.protocol === 'http:') {
      return Promise.resolve(Response.redirect(`https://${url.host}${url.pathname}${url.search}`, 308));
    }

    return env.ASSETS.fetch(request);
  },
};

export default worker;
