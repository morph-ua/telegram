export default async function (route: string, id: string | number) {
    const resp = await fetch(
        `https://api.decline.live/v2/${route}/${id}?token=${Deno.env.get(
            "BOT_TOKEN",
        )}`,
    );
    return { json: await resp.json(), status: resp.status };
}
