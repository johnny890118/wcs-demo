export default function handler(req, res) {
  if (req.method === "POST") {
    const body = req.body;
    res.status(200).json({ message: "數據接收成功", data: body });
  } else {
    res.status(405).end();
  }
}
