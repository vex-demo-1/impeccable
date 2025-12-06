import { getSkills } from "../server/lib/api-handlers.js";

export default {
  async fetch(request) {
    const skills = await getSkills();
    return Response.json(skills);
  },
};

