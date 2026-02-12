
# Downgrading Prisma to v5 to avoid v7 instability/breaking changes
npm uninstall prisma @prisma/client
npm install prisma@5.10.0 @prisma/client@5.10.0
