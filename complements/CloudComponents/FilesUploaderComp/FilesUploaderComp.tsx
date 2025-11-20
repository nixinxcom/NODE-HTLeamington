// complements/CloudComponents/FilesUploaderComp/FilesUploaderComp.tsx
// (tu ruta original)

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { UploadStorage } from "@/functionalities/CommonFunctions/UseCloudStorageFunc";
import styles from "./FilesUploaderComp.module.css";
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SELECT2, LABEL2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

interface IDoctos {
  cloud: {
    store: boolean;
    path: string;
    storageFiles: {
      appName: string;
      fileTypes: "Images" | "Documents" | "Multimedia" | "Any";
    };
    TypeSize: "bytes" | "Kb" | "Mb" | "Gb";
    maxSizeImg: number;
    maxSizeFile: number;
  };
  selection: {
    multiple: boolean;
    DocumentCap: number;
    display: { visible: boolean; maxRowsDisplay: number };
  };
  compTitles: { select: string; restore: string; submit: string; logo?: string };
  blockWidth: number;
  blockHeight: number;
  classNames?: string;
  styles?: React.CSSProperties;

  /** NUEVO: No subir ni mostrar submit interno; el padre decide cuándo subir */
  deferUpload?: boolean;

  /** NUEVO: callback al cambiar la selección (archivos válidos a subir) */
  onChange?: (files: IFile[]) => void;

  /** NUEVO: sufijo para los webp redimensionados (p.ej. "700x700") */
  resizedSuffixSize?: string; // default: "700x700"
}

const ValidFormats = "image/gif, image/png, image/jpeg, image/jpg";

export interface IFile {
  file: File;
  orig_url: string;
  Dcto_url: string;
  name: string;
  type: string;
  shortname: string;
  storaged_name: string;
  orig_order: number;
}

export default function FilesUploaderComp(props: IDoctos) {
  const typesImages = ".gif, .png, .jpeg, .jpg";
  const typesDocuments = ".txt, .doc, .docx, .pdf";
  const typesMultimedia = ".mp3, .mp4, .avi, .mov";
  const typesAny = "*.*";
  const types =
    props.cloud.storageFiles.fileTypes == "Images"
      ? typesImages
      : props.cloud.storageFiles.fileTypes == "Documents"
      ? typesDocuments
      : props.cloud.storageFiles.fileTypes == "Multimedia"
      ? typesMultimedia
      : typesAny;

  const [DctoPreviews, setDctoPreviews] = useState<IFile[]>([]);
  const [RestorableDctos, setRestorableDctos] = useState<IFile[]>([]);
  const [DctosUrl, setDctosUrl] = useState<string[]>([]);

  const suffix = props.resizedSuffixSize || "700x700";

  useEffect(() => {
    DctoPreviews.forEach((item) => setDctosUrl((prev) => [...prev, item.Dcto_url]));
    props.onChange?.(DctoPreviews); // <- notifica al padre la selección actual
  }, [DctoPreviews]); // eslint-disable-line

  interface ICloudStore {
    event: any;
    Files: IFile[];
    setFiles: React.SetStateAction<any>;
    fileTypes: "Images" | "Documents" | "Multimedia" | "Any";
    path?: string;
    appName: string;
  }
  const handleSubmit = (p: ICloudStore) => {
    p.event.preventDefault();
    UploadStorage({
      Files: p.Files,
      fileTypes: p.fileTypes,
      path: p.path,
      appName: p.appName,
    });
  };

  interface IHandleSelection {
    e: any;
    ArrayState: IFile[];
    setArrayState: React.SetStateAction<any>;
    setResult?: React.SetStateAction<any>;
    CapDocuments: number;
  }

  function safeBaseName(n: string) {
    const base = n.replace(/\.[^.]+$/, "");
    return base;
  }

  const handleSelection = (H: IHandleSelection) => {
    let DocumentCollection: IFile[] = [];
    if (Array.from(H.e).length > 0) {
      let append = true;
      let Large = Array.from(H.e).length;
      (Array.from(H.e) as File[]).forEach((Dcto: File, i) => {
        H.ArrayState.forEach((prev) => {
          prev.name == Dcto.name && ((append = false), (Large = Large - 1));
        });

        const maxUnit =
          props.cloud.TypeSize == "bytes"
            ? 1
            : props.cloud.TypeSize == "Kb"
            ? 1024
            : props.cloud.TypeSize == "Mb"
            ? 1024 * 1024
            : 1024 * 1024 * 1024;

        if (ValidFormats.includes(Dcto.type)) {
          Dcto.size > props.cloud.maxSizeImg * maxUnit && ((append = false), (Large = Large - 1));
        } else {
          Dcto.size > props.cloud.maxSizeFile * maxUnit && ((append = false), (Large = Large - 1));
        }

        if (i < H.CapDocuments && append) {
          const short = safeBaseName(Dcto.name);
          const storaged = ValidFormats.includes(Dcto.type)
            ? `${short}_${suffix}.webp`
            : Dcto.name;

          const docToAdd: IFile = {
            file: Dcto,
            orig_url: URL.createObjectURL(Dcto),
            Dcto_url: "",
            name: Dcto.name,
            type: Dcto.type,
            shortname: short,
            storaged_name: storaged,
            orig_order: H.ArrayState.length + DocumentCollection.length,
          };
          DocumentCollection = DocumentCollection.concat(docToAdd);
          H.setArrayState(H.ArrayState.concat(DocumentCollection));
        }
        append = true;
      });
      H.setResult && H.setResult(H.ArrayState.length);
    }
  };

  interface IRemove {
    item: IFile;
    delId: string;
    ArrayToCrop: IFile[];
    setArrayToCrop: React.SetStateAction<any>;
    ArrayToRestore: IFile[];
    setArrayToRestore: React.SetStateAction<any>;
  }
  function removePreview(p: IRemove) {
    let append = true;
    p.ArrayToRestore.forEach((prev) => {
      prev.name == p.item.name && (append = false);
    });
    if (append) {
      p.setArrayToRestore([...p.ArrayToRestore, p.item]);
    }
    const idx = p.ArrayToCrop.findIndex((x) => x.orig_url === p.item.orig_url);
    p.ArrayToCrop.splice(idx, 1);
    p.setArrayToCrop([...p.ArrayToCrop]);
  }

  interface IRestore {
    item: IFile;
    delId: string;
    ArrayToRestore: IFile[];
    setArrayToRestore: React.SetStateAction<any>;
    ArrayToAppend: IFile[];
    setArrayToAppend: React.SetStateAction<any>;
  }
  function RestorePreview(p: IRestore) {
    let append = true;
    let Large = p.ArrayToAppend.length;
    p.ArrayToAppend.forEach((prev) => {
      prev.name == p.item.name && ((append = false), (Large = Large - 1));
    });
    if (append && props.selection.DocumentCap - Large > 0) {
      p.setArrayToAppend([...p.ArrayToAppend, p.item]);
      const idx = p.ArrayToRestore.findIndex((x) => x.orig_url === p.item.orig_url);
      p.ArrayToRestore.splice(idx, 1);
      p.setArrayToRestore([...p.ArrayToRestore]);
    }
  }

  return (
    <>
      <div
        id={styles.DctoCompContainer}
        className={props.classNames}
        style={Object.assign(
          { maxHeight: 35 + props.selection.display.maxRowsDisplay * props.blockHeight },
          props.styles
        )}
      >
        <div id="FilesUploaderComp" className={styles.DctoCompForm}>
          {/* Selector */}
          {props.selection.DocumentCap - DctoPreviews.length > 0 &&
            (!DctoPreviews[0] || DctoPreviews[0].Dcto_url == "") && (
              <div
                className={styles.DocumentSelector}
                style={{ width: props.blockWidth, height: props.blockHeight }}
              >
                <LABEL htmlFor="DctoSel" className={styles.SelLabel}>
                  {props.compTitles.select}
                  <br />
                  {props.selection.DocumentCap - DctoPreviews.length}
                </LABEL>
                <INPUT
                  id="DctoSel"
                  type="file"
                  multiple={props.selection.multiple}
                  className={styles.FileSelector}
                  accept={types}
                  onChange={(e) =>
                    handleSelection({
                      e: e.target.files,
                      ArrayState: DctoPreviews,
                      setArrayState: setDctoPreviews,
                      CapDocuments: props.selection.DocumentCap,
                    })
                  }
                />
              </div>
            )}

          {/* Previews */}
          {props.selection.display.visible &&
            DctoPreviews[0] &&
            DctoPreviews.map((Dcto) => {
              return (
                <div
                  key={Dcto.orig_url + "Rest"}
                  className={styles.DctoPreview}
                  style={{
                    width: props.blockWidth,
                    height: props.blockHeight,
                    minWidth: "clamp(min-content,min-content,auto)",
                    minHeight: "clamp(min-content,min-content,auto)",
                  }}
                >
                  <SPAN
                    key={Dcto.orig_url}
                    className={styles.SpanDelete}
                    onClick={() =>
                      removePreview({
                        item: Dcto,
                        delId: Dcto.orig_url,
                        ArrayToCrop: DctoPreviews,
                        setArrayToCrop: setDctoPreviews,
                        ArrayToRestore: RestorableDctos,
                        setArrayToRestore: setRestorableDctos,
                      })
                    }
                  />
                  {ValidFormats.includes(Dcto.type) ? (
                    <Image
                      src={Dcto.orig_url}
                      fill
                      alt={Dcto.name}
                      onDragEnd={() =>
                        removePreview({
                          item: Dcto,
                          delId: Dcto.orig_url,
                          ArrayToCrop: DctoPreviews,
                          setArrayToCrop: setDctoPreviews,
                          ArrayToRestore: RestorableDctos,
                          setArrayToRestore: setRestorableDctos,
                        })
                      }
                    />
                  ) : (
                    <div
                      onDragEnd={() =>
                        removePreview({
                          item: Dcto,
                          delId: Dcto.orig_url,
                          ArrayToCrop: DctoPreviews,
                          setArrayToCrop: setDctoPreviews,
                          ArrayToRestore: RestorableDctos,
                          setArrayToRestore: setRestorableDctos,
                        })
                      }
                    >
                      {Dcto.name}
                    </div>
                  )}
                </div>
              );
            })}

          {/* Restorables */}
          {props.selection.display.visible &&
            RestorableDctos.map((Dcto) => {
              if (props.selection.DocumentCap - DctoPreviews.length > 0) {
                return (
                  <div
                    key={Dcto.orig_url + "Rest"}
                    className={styles.SpanContain}
                    style={{ width: props.blockWidth, height: props.blockHeight }}
                  >
                    <blockquote
                      className={styles.blockquote}
                      cite={Dcto.name}
                      style={{ width: props.blockWidth, height: props.blockHeight }}
                      draggable
                      onDragEnd={() =>
                        RestorePreview({
                          item: Dcto,
                          delId: Dcto.orig_url,
                          setArrayToRestore: setRestorableDctos,
                          ArrayToRestore: RestorableDctos,
                          ArrayToAppend: DctoPreviews,
                          setArrayToAppend: setDctoPreviews,
                        })
                      }
                      onClick={() =>
                        RestorePreview({
                          item: Dcto,
                          delId: Dcto.orig_url,
                          setArrayToRestore: setRestorableDctos,
                          ArrayToRestore: RestorableDctos,
                          ArrayToAppend: DctoPreviews,
                          setArrayToAppend: setDctoPreviews,
                        })
                      }
                    >
                      {ValidFormats.includes(Dcto.type) && (
                        <Image className={styles.Previews} src={Dcto.orig_url} fill alt={Dcto.name} />
                      )}
                    </blockquote>
                  </div>
                );
              }
            })}
        </div>
      </div>

      {/* Submit interno (sólo si NO se difiere) */}
      {!props.deferUpload && DctoPreviews[0] && (
        <BUTTON
          id={styles.SubmitImages}
          onClick={(e) =>
            handleSubmit({
              event: e,
              Files: DctoPreviews,
              setFiles: setDctoPreviews,
              fileTypes: props.cloud.storageFiles.fileTypes,
              path: props.cloud.path,
              appName: props.cloud.storageFiles.appName,
            })
          }
        >
          {props.compTitles.submit}
        </BUTTON>
      )}
    </>
  );
}