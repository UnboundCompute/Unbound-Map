/** Published Casefiles with a concrete Atropos model binding. */
export const casefileFamilies: Record<string, string[]> = {
  'javascript.std.eval.a0': ['/cves/cve-2017-5941-serialize/'],
  'javascript.proto.computed-write.a0': ['/cves/cve-2019-10744-lodash/', '/cves/cve-2021-23434-object-path/', '/cves/cve-2022-24999-qs/', '/cves/cve-2022-46175-json5/', '/cves/cve-2026-41690-i18next-http-middleware/'],
  'javascript.collection.find.a0': ['/cves/cve-2019-10748-sequelize/'],
  'python.os.makedirs.a0': ['/cves/cve-2020-11652-salt/'],
  'python.marshal.load.a0': ['/cves/cve-2020-14343-pyyaml/'],
  'python.subprocess.run.a0': ['/cves/cve-2020-16846-salt/', '/cves/cve-2025-64340-fastmcp/'],
  'javascript.childprocess.exec.a0': ['/cves/cve-2021-21315-systeminformation/'],
  'javascript.std.regexp.a0': ['/cves/cve-2021-3807-ansi-regex/', '/cves/cve-2022-25883-node-semver/'],
  'javascript.std.fetch.a0': ['/cves/cve-2022-0235-node-fetch/'],
  'python.urllibrequesturlopener.open.a0': ['/cves/cve-2022-0577-scrapy/'],
  'python.builtins.eval.a0': ['/cves/cve-2022-21797-joblib/', '/cves/cve-2023-50447-pillow/'],
  'typescript.location.assign.a0': ['/cves/cve-2022-33987-got/'],
  'c.std.memcpy.a2': ['/cves/cve-2022-37434-zlib/', '/cves/cve-2023-38545-curl/', '/cves/cve-2025-3277-sqlite/', '/cves/cve-2025-6021-libxml2/', '/cves/cve-2026-5295-wolfssl/'],
  'python.jinja2.template.a0': ['/cves/cve-2023-36258-langchain/'],
  'javascript.lodash.merge.a1': ['/cves/cve-2023-36665-protobuf-js/'],
  'javascript.vm.script.a0': ['/cves/cve-2023-37903-vm2/'],
  'python.requests.get.a0': ['/cves/cve-2023-46229-langchain/'],
  'python.pathlib.path.a0': ['/cves/cve-2023-51449-gradio/', '/cves/cve-2024-23334-aiohttp/'],
  'typescript.proto.computed-write.a0': ['/cves/cve-2023-6293-sequelize-typescript/', '/cves/cve-2025-68130-trpc/'],
  'python.pickle.load.a0': ['/cves/cve-2023-6730-transformers/'],
  'python.djangodbbackendsutilscursorwrapper.execute.a0': ['/cves/cve-2024-42005-django/'],
  'javascript.client.search.a1': ['/cves/cve-2024-53900-mongoose/'],
  'c.std.strcat.a0': ['/cves/cve-2025-24928-libxml2/'],
  'typescript.regex.match.recv': ['/cves/cve-2025-25285-endpoint-js/'],
  'python.torch.load.a0': ['/cves/cve-2025-32434-pytorch/'],
  'python.queryset.extra.a0': ['/cves/cve-2025-59681-django/'],
  'python.io.open.a0': ['/cves/cve-2025-59682-django/'],
  'python.importlib.importmodule.a0': ['/cves/cve-2025-68664-langchain-core/'],
  'typescript.fs.readfile.a0': ['/cves/cve-2026-25062-outline/'],
};

export function casefileLabel(path: string) {
  const slug = path.split('/').filter(Boolean).pop() || path;
  return slug.replace(/^cve-/, 'CVE-');
}
