import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

async function authorize(credentials) {
  const superUser = {
    user: "xx",
    password: "xandx",
  };

  if (
    credentials.username === superUser.user &&
    credentials.password === superUser.password
  ) {
    return { id: "1", name: superUser.user };
  } else {
    throw new Error("Credentials are incorrect");
  }
}

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize,
    }),
  ],
  jwt: {
    secret: process.env.JWT_SECRET,
  },
});
